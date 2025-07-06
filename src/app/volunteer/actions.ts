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
      status: 'open' as const,
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
    
    // We need to fetch the existing status to return the full job object
    const updatedDoc = await jobRef.get();
    const existingData = updatedDoc.data() as Job;

    const updatedJob: Job = { id: jobId, ...updatedData, status: existingData.status ?? 'open' };
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

export async function updateJobStatus(jobId: string, status: 'open' | 'closed', token?: string) {
  try {
    const adminCheck = await isAdmin(token);
    if (!adminCheck.isAdmin) {
      return { error: "Unauthorized" };
    }

    const jobRef = adminDb.collection('jobs').doc(jobId);
    await jobRef.update({ status });
    
    revalidatePath('/volunteer');
    revalidatePath('/admin');
    
    return { success: `Job status updated to ${status}.` };
  } catch (error) {
    console.error("Error updating job status: ", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: `Failed to update job status: ${errorMessage}` };
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

    // Check if job is open
    const jobDoc = await adminDb.collection('jobs').doc(validatedData.jobId).get();
    if (!jobDoc.exists || (jobDoc.data()?.status === 'closed')) {
        return { error: 'This job is no longer open for applications.' };
    }

    // Check if user has already applied
    const existingApplication = await adminDb.collection('applications')
        .where('userId', '==', uid)
        .where('jobId', '==', validatedData.jobId)
        .limit(1)
        .get();

    if (!existingApplication.empty) {
        return { error: 'You have already applied for this job.' };
    }

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
    revalidatePath('/volunteer');
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

export async function getUserApplications(token: string | undefined): Promise<ClientJobApplication[]> {
  const uid = await getVerifiedUid(token);
  if (!uid) {
    // Return empty array if user is not logged in, this is not an error condition.
    return [];
  }

  try {
    // NOTE ON FIRESTORE INDEXES:
    // This query requires a composite index to function correctly. If you are seeing
    // errors or empty results, please create the following index in your Firestore console:
    // Collection: applications, Fields: userId (Ascending), submittedAt (Descending)
    const appSnapshot = await adminDb.collection('applications').where('userId', '==', uid).orderBy('submittedAt', 'desc').get();
    
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
        // The submittedAt field is a Firestore Timestamp, so we convert it to a string
        submittedAt: data.submittedAt.toDate().toISOString(),
        status: data.status,
      };
      return clientApp;
    });
    return applications;
  } catch (error: any) {
    console.error("Error fetching user applications:", error);
    // Re-throwing the error so it can be caught by the client component and displayed in a toast.
    // We add a more user-friendly message to the error.
    if (error.code === 'failed-precondition') {
      throw new Error('A database index is required for this query. Please check server logs for a link to create it.');
    }
    throw new Error('An error occurred while fetching your applications.');
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
    // NOTE ON FIRESTORE INDEXES:
    // This query logic can generate several different query shapes depending on the
    // filters selected by the user. To ensure all combinations work correctly,
    // you must create the following composite indexes in your Firestore database.
    // The Firestore console will often provide a direct link to create a missing
    // index in the error logs.
    //
    // 1. To filter by status AND job title (and to filter by status only):
    //    - Collection: applications
    //    - Fields: status (Ascending), jobTitle (Ascending), submittedAt (Descending)
    //
    // 2. To filter by job title ONLY:
    //    - Collection: applications
    //    - Fields: jobTitle (Ascending), submittedAt (Descending)
    //
    // If these indexes are missing, Firestore may return empty results without an error.

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

// Admin Management Actions
export async function getAdmins(token: string): Promise<{admins?: {uid: string, email: string}[], error?: string}> {
  const adminCheck = await isAdmin(token);
  if (!adminCheck.isAdmin) {
    return { error: "Unauthorized" };
  }

  try {
    const adminSnapshot = await adminDb.collection('admins').get();
    const adminUids = adminSnapshot.docs.map(doc => doc.id);

    if (adminUids.length === 0) {
      return { admins: [] };
    }
    
    // Firestore's `getUsers` can only take up to 100 UIDs at a time.
    // For this app, that's a safe assumption, but for a larger app, batching would be needed.
    const adminUsers = await adminAuth.getUsers(adminUids.map(uid => ({ uid })));

    const admins = adminUsers.users.map(user => ({
      uid: user.uid,
      email: user.email || 'No email found',
    }));

    return { admins: admins.sort((a,b) => a.email.localeCompare(b.email)) };
  } catch (error) {
    console.error("Error fetching admins:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: `Failed to fetch admins: ${errorMessage}` };
  }
}

export async function addAdmin(email: string, token: string): Promise<{admin?: {uid: string, email: string}, error?: string}> {
  const adminCheck = await isAdmin(token);
  if (!adminCheck.isAdmin) {
    return { error: "Unauthorized" };
  }

  if (!email) {
    return { error: "Email cannot be empty." };
  }

  try {
    const userRecord = await adminAuth.getUserByEmail(email);
    const uid = userRecord.uid;

    await adminDb.collection('admins').doc(uid).set({});
    
    revalidatePath('/admin');

    return { admin: { uid, email: userRecord.email! } };
  } catch (error: any) {
    console.error("Error adding admin:", error);
    if (error.code === 'auth/user-not-found') {
      return { error: `User with email ${email} not found.` };
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: `Failed to add admin: ${errorMessage}` };
  }
}

export async function removeAdmin(uidToRemove: string, token: string): Promise<{success?: boolean, error?: string}> {
  const adminCheck = await isAdmin(token);
  if (!adminCheck.isAdmin) {
    return { error: "Unauthorized" };
  }
  
  const currentUid = await getVerifiedUid(token);
  if (currentUid === uidToRemove) {
      return { error: "You cannot remove yourself as an admin." };
  }
  
  try {
    await adminDb.collection('admins').doc(uidToRemove).delete();
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error("Error removing admin:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { error: `Failed to remove admin: ${errorMessage}` };
  }
}
