'use server';

import { adminDb, adminMessaging } from '@/lib/firebase-admin';
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
    let isNewAnnouncement = false;
    if (id) {
      await adminDb.collection('announcements').doc(id).update({ content });
    } else {
      isNewAnnouncement = true;
      await adminDb.collection('announcements').add({ 
        content,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    if (isNewAnnouncement) {
      try {
        const message = {
          notification: {
            title: 'New DevFest Vizag Announcement!',
            body: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          },
          webpush: {
            fcmOptions: {
              link: '/',
            },
            notification: {
              icon: '/icons/icon-192x192.png',
            },
          },
          topic: 'all_users',
        };
        await adminMessaging.send(message);
        console.log('Successfully sent push notification.');
      } catch (fcmError) {
        console.error('Error sending FCM message:', fcmError);
      }
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

export async function subscribeToTopic(token: string, fcmToken: string) {
  const adminCheck = await isAdmin(token); // Use this for user verification if needed, or implement your own logic
  if (!adminCheck.isAdmin && !fcmToken) { // Example check
    return { error: 'Unauthorized or missing token' };
  }
  
  try {
    await adminMessaging.subscribeToTopic(fcmToken, 'all_users');
    return { success: true };
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    return { error: 'Failed to subscribe' };
  }
}
