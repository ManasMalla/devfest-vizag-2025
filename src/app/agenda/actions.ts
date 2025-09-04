'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { AgendaItem, AgendaTrack } from '@/types';
import { z } from 'zod';
import { isAdmin } from '../volunteer/actions';
import { revalidatePath } from 'next/cache';

const AgendaItemSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, 'Title is required.'),
  speaker: z.string().optional(),
  description: z.string().optional(),
  track: z.string().min(1, 'A track must be selected.'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format.'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be in HH:MM format.'),
}).refine(data => data.endTime > data.startTime, {
  message: "End time must be after start time.",
  path: ["endTime"],
});

const AgendaTrackSchema = z.object({
  name: z.string().min(1, 'Track name cannot be empty.'),
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
    const errorDetails = validation.error.flatten().fieldErrors;
    console.error("Validation failed:", errorDetails);
    return { error: 'Invalid data', details: errorDetails };
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

// Track Actions
export async function getAgendaTracks(): Promise<AgendaTrack[]> {
    try {
        const snapshot = await adminDb.collection('agendaTracks').orderBy('name').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AgendaTrack));
    } catch (error) {
        console.error("Error fetching agenda tracks: ", error);
        return [];
    }
}

export async function manageAgendaTrack(formData: FormData, token: string) {
    const adminCheck = await isAdmin(token);
    if (!adminCheck.isAdmin) return { error: 'Unauthorized' };

    const rawData = Object.fromEntries(formData.entries());
    const validation = AgendaTrackSchema.safeParse(rawData);

    if (!validation.success) {
        return { error: 'Invalid data', details: validation.error.flatten().fieldErrors };
    }

    try {
        await adminDb.collection('agendaTracks').add(validation.data);
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to save track.' };
    }
}

export async function deleteAgendaTrack(id: string, token: string) {
    const adminCheck = await isAdmin(token);
    if (!adminCheck.isAdmin) return { error: 'Unauthorized' };
    
    try {
        await adminDb.collection('agendaTracks').doc(id).delete();
        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        return { error: 'Failed to delete track.' };
    }
}
