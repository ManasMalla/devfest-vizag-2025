'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { AgendaItem } from '@/types';
import { z } from 'zod';
import { isAdmin } from '../volunteer/actions';
import { revalidatePath } from 'next/cache';

const AgendaItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, 'Title is required.'),
  speaker: z.string().optional(),
  description: z.string().optional(),
  track: z.string().min(1, 'Track is required.'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format.'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be in HH:MM format.'),
}).refine(data => data.endTime > data.startTime, {
  message: "End time must be after start time.",
  path: ["endTime"],
});

export async function getAgenda(): Promise<AgendaItem[]> {
  try {
    const snapshot = await adminDb.collection('agenda').orderBy('startTime').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AgendaItem));
  } catch (error) {
    console.error("Error fetching agenda: ", error);
    return [];
  }
}

export async function manageAgendaItem(formData: FormData, token: string) {
  const adminCheck = await isAdmin(token);
  if (!adminCheck.isAdmin) {
    return { error: 'Unauthorized' };
  }

  const rawData = Object.fromEntries(formData.entries());
  const validation = AgendaItemSchema.safeParse(rawData);

  if (!validation.success) {
    return { error: 'Invalid data', details: validation.error.flatten().fieldErrors };
  }

  const { id, ...itemData } = validation.data;

  try {
    if (id) {
      await adminDb.collection('agenda').doc(id).update(itemData);
    } else {
      await adminDb.collection('agenda').add(itemData);
    }
    revalidatePath('/agenda');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error("Error managing agenda item:", error);
    return { error: 'Failed to save agenda item.' };
  }
}

export async function deleteAgendaItem(id: string, token: string) {
  const adminCheck = await isAdmin(token);
  if (!adminCheck.isAdmin) {
    return { error: 'Unauthorized' };
  }

  try {
    await adminDb.collection('agenda').doc(id).delete();
    revalidatePath('/agenda');
    revalidatePath('/admin');
    return { success: true };
  } catch (error) {
    console.error("Error deleting agenda item:", error);
    return { error: 'Failed to delete agenda item.' };
  }
}
