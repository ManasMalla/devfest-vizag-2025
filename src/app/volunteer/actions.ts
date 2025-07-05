'use server';

import { auth, db } from '@/lib/firebase';
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


// Admin check
export async function isAdmin() {
  if (!auth.currentUser) {
    return { isAdmin: false };
  }
  try {
    const userDoc = await adminDb.collection('admins').doc(auth.currentUser.uid).get();
    return { isAdmin: userDoc.exists };
  } catch (error) {
    console.error("Error checking admin status:", error);
    return { isAdmin: false };
  }
}

// Job actions
export async function getJobs(): Promise<Job[]> {
  try {
    const jobsCollection = collection(db, 'jobs');
    const q = query(jobsCollection, orderBy('title'));
    const jobSnapshot = await getDocs(q);
    const jobList = jobSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
    return jobList;
  } catch (error) {
    console.error("Error fetching jobs: ", error);
    return [];
  }
}

export async function addJob(formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
  const validatedFields = JobSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { error: "Invalid data. " + validatedFields.error.flatten().fieldErrors };
  }
  
  const { title, description, category, additionalQuestions } = validatedFields.data;

  const adminCheck = await isAdmin();
  if (!adminCheck.isAdmin) {
    return { error: "Unauthorized" };
  }

  try {
    await addDoc(collection(db, 'jobs'), {
      title,
      description,
      category,
      additionalQuestions: additionalQuestions?.split('\n').filter(q => q.trim() !== '') || [],
    });
    revalidatePath('/volunteer');
    revalidatePath('/admin');
    return { success: "Job added successfully." };
  } catch (error) {
    return { error: 'Failed to add job.' };
  }
}

export async function updateJob(jobId: string, formData: FormData) {
  const rawData = Object.fromEntries(formData.entries());
   const validatedFields = JobSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return { error: "Invalid data." };
  }
  
  const { title, description, category, additionalQuestions } = validatedFields.data;

  const adminCheck = await isAdmin();
  if (!adminCheck.isAdmin) {
    return { error: "Unauthorized" };
  }
  
  try {
    const jobRef = doc(db, 'jobs', jobId);
    await updateDoc(jobRef, {
      title,
      description,
      category,
      additionalQuestions: additionalQuestions?.split('\n').filter(q => q.trim() !== '') || [],
    });
    revalidatePath('/volunteer');
    revalidatePath('/admin');
    return { success: "Job updated successfully." };
  } catch (error) {
    return { error: 'Failed to update job.' };
  }
}

export async function deleteJob(jobId: string) {
  const adminCheck = await isAdmin();
  if (!adminCheck.isAdmin) {
    return { error: "Unauthorized" };
  }

  try {
    await deleteDoc(doc(db, 'jobs', jobId));
    revalidatePath('/volunteer');
    revalidatePath('/admin');
    return { success: "Job deleted successfully." };
  } catch (error) {
    return { error: 'Failed to delete job.' };
  }
}


// Application actions
export async function submitApplication(formData: FormData) {
  if (!auth.currentUser) {
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

  const applicationData: Omit<JobApplication, 'id' | 'submittedAt'> = {
    ...validatedFields.data,
    userId: auth.currentUser.uid,
    userEmail: auth.currentUser.email!,
    answers: validatedFields.data.answers || {},
  };

  try {
    await addDoc(collection(db, 'applications'), {
      ...applicationData,
      submittedAt: serverTimestamp(),
    });
    return { success: 'Application submitted successfully!' };
  } catch (error) {
    console.error("Error submitting application: ", error);
    return { error: 'There was an error submitting your application.' };
  }
}
