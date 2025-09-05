'use server';

import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import { isAdmin } from '../volunteer/actions';
import { revalidatePath } from 'next/cache';
import { Announcement } from '@/types';

const AnnouncementSchema = z.object({
  id: z.string().optional(),
  content: z.string().min(10, 'Content must be at least 10 characters long.'),
});

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const snapshot = await adminDb.collection('announcements').orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        content: data.content,
        createdAt: data.createdAt.toDate().toISOString(),
      } as Announcement;
    });
  } catch (error) {
    console.error("Error fetching announcements: ", error);
    return [];
  }
}

export async function manageAnnouncement(formData: FormData, token: string) {
  const adminCheck = await isAdmin(token);
  if (!adminCheck.isAdmin) {
    return { error: 'Unauthorized' };
  }

  const rawData = Object.fromEntries(formData.entries());
  const validation = AnnouncementSchema.safeParse(rawData);

  if (!validation.success) {
    return { error: 'Invalid data', details: validation.error.flatten().fieldErrors };
  }
  
  const { id, content } = validation.data;

  try {
    if (id) {
      await adminDb.collection('announcements').doc(id).update({ content });
    } else {
      await adminDb.collection('announcements').add({ 
        content,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error("Error managing announcement:", error);
    return { error: 'Failed to save announcement.' };
  }
}

export async function deleteAnnouncement(id: string, token: string) {
  const adminCheck = await isAdmin(token);
  if (!adminCheck.isAdmin) {
    return { error: 'Unauthorized' };
  }

  try {
    await adminDb.collection('announcements').doc(id).delete();
    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error("Error deleting announcement:", error);
    return { error: 'Failed to delete announcement.' };
  }
}
