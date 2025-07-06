'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import type { Team, UserRole, Volunteer } from '@/types';
import { revalidatePath } from 'next/cache';
import { getUserRole, isAdmin } from '../actions';

// Helper to verify token and get UID
async function getVerifiedUid(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const decodedToken = await adminAuth.verifyIdToken(token, true);
    return decodedToken.uid;
  } catch (error) {
    console.error("Error verifying ID token:", error);
    return null;
  }
}

async function verifyAuthorized(token: string): Promise<{role: UserRole, error?: string}> {
    const role = await getUserRole(token);
    const authorizedRoles: UserRole[] = ['Admin', 'Team Lead', 'Volunteer'];
    if (!authorizedRoles.includes(role)) {
        return { role, error: 'Unauthorized: Access Denied' };
    }
    return { role };
}


export async function getDashboardData(token: string): Promise<{ data?: { teams: Team[], volunteers: Volunteer[], role: UserRole }, error?: string }> {
    const authCheck = await verifyAuthorized(token);
    if (authCheck.error) {
        return { error: authCheck.error };
    }
    
    try {
        const teamsSnapshot = await adminDb.collection('teams').orderBy('name').get();
        const teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));

        const volunteersSnapshot = await adminDb.collection('volunteers').get();
        const volunteers = volunteersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Volunteer));

        return { data: { teams, volunteers, role: authCheck.role } };
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { error: `Failed to fetch dashboard data: ${errorMessage}` };
    }
}

export async function manageTeam(data: { id?: string, name: string }, token: string): Promise<{ success?: boolean, error?: string }> {
    const adminCheck = await isAdmin(token);
    if (!adminCheck.isAdmin) return { error: 'Unauthorized' };

    if (!data.name) return { error: 'Team name cannot be empty' };

    try {
        if (data.id) {
            await adminDb.collection('teams').doc(data.id).update({ name: data.name });
        } else {
            await adminDb.collection('teams').add({ name: data.name });
        }
        revalidatePath('/volunteer/dashboard');
        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { error: `Failed to save team: ${errorMessage}` };
    }
}

export async function deleteTeam(id: string, token: string): Promise<{ success?: boolean, error?: string }> {
    const adminCheck = await isAdmin(token);
    if (!adminCheck.isAdmin) return { error: 'Unauthorized' };

    try {
        const batch = adminDb.batch();
        
        // Find volunteers in the team and unassign them
        const volunteersInTeam = await adminDb.collection('volunteers').where('teamId', '==', id).get();
        volunteersInTeam.docs.forEach(doc => {
            batch.update(doc.ref, { teamId: null });
        });

        // Delete the team document
        const teamRef = adminDb.collection('teams').doc(id);
        batch.delete(teamRef);
        
        await batch.commit();

        revalidatePath('/volunteer/dashboard');
        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { error: `Failed to delete team: ${errorMessage}` };
    }
}

export async function assignVolunteerTeam(volunteerId: string, teamId: string | null, token: string): Promise<{ success?: boolean, error?: string }> {
    const adminCheck = await isAdmin(token);
    if (!adminCheck.isAdmin) return { error: 'Unauthorized' };
    
    try {
        await adminDb.collection('volunteers').doc(volunteerId).update({ teamId });
        revalidatePath('/volunteer/dashboard');
        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { error: `Failed to assign team: ${errorMessage}` };
    }
}

export async function updateVolunteerLeadStatus(volunteerId: string, isLead: boolean, token: string): Promise<{ success?: boolean, error?: string }> {
    const adminCheck = await isAdmin(token);
    if (!adminCheck.isAdmin) return { error: 'Unauthorized' };
    
    try {
        await adminDb.collection('volunteers').doc(volunteerId).update({ isLead });
        revalidatePath('/volunteer/dashboard');
        return { success: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { error: `Failed to update lead status: ${errorMessage}` };
    }
}
