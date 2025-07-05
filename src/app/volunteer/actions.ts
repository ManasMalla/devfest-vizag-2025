'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import type { Job, JobApplication, ApplicationStatus, ClientJobApplication } from '@/types';
import { FieldValue, type Query } from 'firebase-admin/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const ITEMS_PER_PAGE = 10;

// Zod schemas for validation
const JobSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters long'),
  description: z.string().min(10, 'Description must be at least 10 characters long'),
  category: z.enum(['Lead', 'Volunteer']),
  additionalQuestions: z.string().optional(),
});

const ApplicationSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(10, "A valid phone number is required"),
  whatsapp: z.string().min(10, "A valid WhatsApp number is required"),
  jobId: z.string(),
  jobTitle: z.string(),
  answers: z.record(z.string()).optional(),
});

// Helper to verify token and get UID
async function getVerifiedUid(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const decodedToken = await adminAuth.verifyIdToken(token, true); // Check for revocation
    return decodedToken.uid;
  } catch (error) {
    console.error("Error verifying ID token:", error);
    return null;
  }
}


// Admin check
export async function isAdmin(token?: string) {
  const uid = await getVerifiedUid(token);
  if (!uid) {
    return { isAdmin: false, error: "Invalid or missing authentication token." };
  }
  try {
    const userDoc = await adminDb.collection('admins').doc(uid).get();
    return { isAdmin: userDoc.exists };
  } catch (error) {
    console.error("Error checking admin status:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { isAdmin: false, error: `An error occurred while checking admin status: ${errorMessage}` };
  }
}

// Job actions
export async function getJobs(): Promise<Job[]> {
  try {
    const jobsCollection = adminDb.collection('jobs');
    const jobSnapshot = await jobsCollection.orderBy('title').get();
    const jobList = jobSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
    return jobList;
  } catch (error) {
    console.error("Error fetching jobs: ", error);
    return [];
  }
}

export async function addJob(formData: FormData, token?: string) {
  try {
    const adminCheck = await isAdmin(token);
    if (!adminCheck.isAdmin) {
      return { error: "Unauthorized" };
    }

    const rawData = Object.fromEntries(formData.entries());
    const validatedData = JobSchema.parse(rawData);
    
    const { title, description, category, additionalQuestions } = validatedData;

    const jobData = {
      title,
      description,
      category,
      additionalQuestions: additionalQuestions?.split('\n').map(q => q.trim()).filter(Boolean) || [],
    };
    const newDocRef = await adminDb.collection('jobs').add(jobData);
    
    revalidatePath('/volunteer');
    revalidatePath('/admin');

    const newJob: Job = { id: newDocRef.id, ...jobData };

    return { success: "Job added successfully.", job: newJob };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Invalid data: " + JSON.stringify(error.flatten().fieldErrors) };
    }
    console.error("Error adding job: ", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: `Failed to add job: ${errorMessage}` };
  }
}

export async function updateJob(jobId: string, formData: FormData, token?: string) {
  try {
    const adminCheck = await isAdmin(token);
    if (!adminCheck.isAdmin) {
      return { error: "Unauthorized" };
    }
    
    const rawData = Object.fromEntries(formData.entries());
    const validatedData = JobSchema.parse(rawData);
    
    const { title, description, category, additionalQuestions } = validatedData;

    const jobRef = adminDb.collection('jobs').doc(jobId);
    const updatedData = {
      title,
      description,
      category,
      additionalQuestions: additionalQuestions?.split('\n').map(q => q.trim()).filter(Boolean) || [],
    };
    await jobRef.update(updatedData);
    
    revalidatePath('/volunteer');
    revalidatePath('/admin');
    
    const updatedJob: Job = { id: jobId, ...updatedData };
    return { success: "Job updated successfully.", job: updatedJob };
  } catch (error) {
     if (error instanceof z.ZodError) {
      return { error: "Invalid data: " + JSON.stringify(error.flatten().fieldErrors) };
    }
    console.error("Error updating job: ", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: `Failed to update job: ${errorMessage}` };
  }
}

export async function deleteJob(jobId: string, token?: string) {
  try {
    const adminCheck = await isAdmin(token);
    if (!adminCheck.isAdmin) {
      return { error: "Unauthorized" };
    }

    await adminDb.collection('jobs').doc(jobId).delete();
    revalidatePath('/volunteer');
    revalidatePath('/admin');
    return { success: "Job deleted successfully." };
  } catch (error) {
    console.error("Error deleting job: ", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: `Failed to delete job: ${errorMessage}` };
  }
}


// Application actions
export async function submitApplication(formData: FormData, token?: string) {
  try {
    const uid = await getVerifiedUid(token);
    if (!uid) {
      return { error: 'You must be signed in to apply.' };
    }

    const rawData: {[k: string]: any} = {};
    formData.forEach((value, key) => {
      if (key.startsWith('answer-')) {
          if (!rawData.answers) rawData.answers = {};
          rawData.answers[key.replace('answer-', '')] = value;
      } else {
          rawData[key] = value;
      }
    });

    const validatedData = ApplicationSchema.parse(rawData);

    const userRecord = await adminAuth.getUser(uid);

    const applicationData = {
      ...validatedData,
      userId: uid,
      userEmail: userRecord.email!,
      answers: validatedData.answers || {},
      status: 'Applied' as const,
      submittedAt: FieldValue.serverTimestamp(),
    };

    await adminDb.collection('applications').add(applicationData);
    return { success: 'Application submitted successfully!' };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Invalid data: " + JSON.stringify(error.flatten().fieldErrors) };
    }
    console.error("Error submitting application: ", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: `There was an error submitting your application: ${errorMessage}` };
  }
}

export async function getApplications(
  token: string | undefined,
  filters: { status: ApplicationStatus | 'All'; jobTitle: string | 'All' },
  pagination: { limit: number; startAfterDocId?: string }
): Promise<{ applications: ClientJobApplication[]; nextCursor: string | null }> {
  const adminCheck = await isAdmin(token);
  if (!adminCheck.isAdmin) {
    return { applications: [], nextCursor: null };
  }
  
  try {
    let query: Query = adminDb.collection('applications');

    if (filters.status !== 'All') {
      query = query.where('status', '==', filters.status);
    }
    if (filters.jobTitle !== 'All') {
      query = query.where('jobTitle', '==', filters.jobTitle);
    }

    query = query.orderBy('submittedAt', 'desc');

    if (pagination.startAfterDocId) {
      const startAfterDoc = await adminDb.collection('applications').doc(pagination.startAfterDocId).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const appSnapshot = await query.limit(pagination.limit).get();
    
    const applications = appSnapshot.docs.map(doc => {
      const data = doc.data();
      const clientApp: ClientJobApplication = {
        id: doc.id,
        jobId: data.jobId,
        jobTitle: data.jobTitle,
        userId: data.userId,
        userEmail: data.userEmail,
        fullName: data.fullName,
        phone: data.phone,
        whatsapp: data.whatsapp,
        answers: data.answers,
        submittedAt: data.submittedAt.toDate().toISOString(),
        status: data.status,
      };
      return clientApp;
    });

    const lastVisible = appSnapshot.docs[appSnapshot.docs.length - 1];
    const nextCursor = lastVisible ? lastVisible.id : null;

    return { applications, nextCursor };
  } catch (error: any) {
    console.error("Error fetching applications: ", error);
    // This specific error code indicates a missing composite index in Firestore.
    // The console will provide a direct link to create it.
    if (error.code === 'failed-precondition') {
      console.error(
        'Firestore query failed. This likely means you need to create a composite index in your Firebase console. The required index will include the fields you are filtering and ordering by (e.g., status, jobTitle, submittedAt).'
      );
    }
    return { applications: [], nextCursor: null };
  }
}


export async function updateApplicationStatus(applicationId: string, status: ApplicationStatus, token?: string) {
  try {
    const adminCheck = await isAdmin(token);
    if (!adminCheck.isAdmin) {
      return { error: "Unauthorized" };
    }

    const appRef = adminDb.collection('applications').doc(applicationId);
    await appRef.update({ status: status });
    
    revalidatePath('/admin');
    
    return { success: `Application status updated to ${status}.` };
  } catch (error) {
    console.error("Error updating application status: ", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: `Failed to update status: ${errorMessage}` };
  }
}
