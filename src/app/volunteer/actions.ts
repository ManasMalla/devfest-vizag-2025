'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import type { Job, JobApplication } from '@/types';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

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
    // This can happen if the token is expired or invalid.
    // It's not necessarily a server error, so we can log it silently on the server
    // and let the client handle the user feedback.
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
    return { isAdmin: false, error: "An error occurred while checking admin status." };
  }
}

// Job actions
export async function getJobs(): Promise<Job[]> {
  try {
    const jobsCollection = collection(adminDb, 'jobs');
    const q = query(jobsCollection, orderBy('title'));
    const jobSnapshot = await getDocs(q);
    const jobList = jobSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
    return jobList;
  } catch (error) {
    console.error("Error fetching jobs: ", error);
    return [];
  }
}

export async function addJob(formData: FormData, token?: string) {
  const adminCheck = await isAdmin(token);
  if (!adminCheck.isAdmin) {
    return { error: "Unauthorized" };
  }

  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = JobSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { error: "Invalid data. " + JSON.stringify(validatedFields.error.flatten().fieldErrors) };
  }
  
  const { title, description, category, additionalQuestions } = validatedFields.data;

  try {
    const jobData = {
      title,
      description,
      category,
      additionalQuestions: additionalQuestions?.split('\n').filter(q => q.trim() !== '') || [],
    };
    const newDocRef = await addDoc(collection(adminDb, 'jobs'), jobData);
    
    revalidatePath('/volunteer');
    revalidatePath('/admin');

    const newJob: Job = { id: newDocRef.id, ...jobData };

    return { success: "Job added successfully.", job: newJob };
  } catch (error) {
    return { error: 'Failed to add job.' };
  }
}

export async function updateJob(jobId: string, formData: FormData, token?: string) {
  const adminCheck = await isAdmin(token);
  if (!adminCheck.isAdmin) {
    return { error: "Unauthorized" };
  }

  const rawData = Object.fromEntries(formData.entries());
   const validatedFields = JobSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { error: "Invalid data." };
  }
  
  const { title, description, category, additionalQuestions } = validatedFields.data;

  try {
    const jobRef = doc(adminDb, 'jobs', jobId);
    const updatedData = {
      title,
      description,
      category,
      additionalQuestions: additionalQuestions?.split('\n').filter(q => q.trim() !== '') || [],
    };
    await updateDoc(jobRef, updatedData);
    
    revalidatePath('/volunteer');
    revalidatePath('/admin');
    
    const updatedJob: Job = { id: jobId, ...updatedData };
    return { success: "Job updated successfully.", job: updatedJob };
  } catch (error) {
    return { error: 'Failed to update job.' };
  }
}

export async function deleteJob(jobId: string, token?: string) {
  const adminCheck = await isAdmin(token);
  if (!adminCheck.isAdmin) {
    return { error: "Unauthorized" };
  }

  try {
    await deleteDoc(doc(adminDb, 'jobs', jobId));
    revalidatePath('/volunteer');
    revalidatePath('/admin');
    return { success: "Job deleted successfully." };
  } catch (error) {
    return { error: 'Failed to delete job.' };
  }
}


// Application actions
export async function submitApplication(formData: FormData, token?: string) {
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

  const validatedFields = ApplicationSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { error: "Invalid data: " + JSON.stringify(validatedFields.error.flatten().fieldErrors) };
  }

  try {
    const userRecord = await adminAuth.getUser(uid);

    const applicationData: Omit<JobApplication, 'id' | 'submittedAt'> = {
      ...validatedFields.data,
      userId: uid,
      userEmail: userRecord.email!,
      answers: validatedFields.data.answers || {},
    };

    await addDoc(collection(adminDb, 'applications'), {
      ...applicationData,
      submittedAt: serverTimestamp(),
    });
    return { success: 'Application submitted successfully!' };
  } catch (error) {
    console.error("Error submitting application: ", error);
    return { error: 'There was an error submitting your application.' };
  }
}
