'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import type { Team, UserRole, Volunteer, Task, TaskStatus } from '@/types';
import { revalidatePath } from 'next/cache';
import { getUserRole, isAdmin } from '../actions';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

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

async function verifyAuthorized(token: string): Promise<{role: UserRole, uid: string, error?: string}> {
    const uid = await getVerifiedUid(token);
    if (!uid) {
      return { role: 'Attendee', uid: '', error: 'Unauthorized: Invalid token' };
    }
    const role = await getUserRole(token);
    const authorizedRoles: UserRole[] = ['Admin', 'Team Lead', 'Volunteer'];
    if (!authorizedRoles.includes(role)) {
        return { role, uid, error: 'Unauthorized: Access Denied' };
    }
    return { role, uid };
}


export async function getDashboardData(token: string): Promise<{ data?: { teams: Team[], volunteers: Volunteer[], tasks: Task[], role: UserRole, uid: string, teamId: string | null }, error?: string }> {
    const authCheck = await verifyAuthorized(token);
    if (authCheck.error) {
        return { error: authCheck.error };
    }
    
    try {
        const [teamsSnapshot, volunteersSnapshot, tasksSnapshot, volunteerDoc] = await Promise.all([
          adminDb.collection('teams').orderBy('name').get(),
          adminDb.collection('volunteers').orderBy('fullName').get(),
          adminDb.collection('tasks').orderBy('createdAt', 'desc').get(),
          adminDb.collection('volunteers').doc(authCheck.uid).get()
        ]);

        const teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
        const volunteers = volunteersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Volunteer));
        const volunteerData = volunteerDoc.data();

        const tasks = tasksSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            dueDate: data.dueDate ? data.dueDate.toDate().toISOString() : null,
            createdAt: data.createdAt.toDate().toISOString(),
          } as Task;
        });

        return { data: { teams, volunteers, tasks, role: authCheck.role, uid: authCheck.uid, teamId: volunteerData?.teamId || null } };
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
        
        const volunteersInTeam = await adminDb.collection('volunteers').where('teamId', '==', id).get();
        volunteersInTeam.docs.forEach(doc => {
            batch.update(doc.ref, { teamId: null });
        });

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

// Task Actions

const ManageTaskFormSchema = z.object({
    id: z.string().optional(),
    title: z.string().min(3, "Title must be at least 3 characters long"),
    description: z.string().optional(),
    dueDate: z.date().optional().nullable(),
    // For non-admins
    assigneeId: z.string().optional(),
    // For admins
    teamId: z.string().optional(),
});


export async function manageTask(formData: z.infer<typeof ManageTaskFormSchema>, token: string): Promise<{ success?: boolean, error?: string }> {
    const authCheck = await verifyAuthorized(token);
    if (authCheck.error) return { error: authCheck.error };
    
    const { role, uid } = authCheck;

    try {
        const creatorDoc = await adminDb.collection('volunteers').doc(uid).get();
        if (!creatorDoc.exists) {
            return { error: "Creator profile not found." };
        }
        const creatorName = creatorDoc.data()?.fullName || 'Unknown';

        let finalAssigneeId: string;
        let finalAssigneeName: string;
        let finalTeamId: string | null;

        if (role === 'Admin') {
            if (!formData.teamId) {
                return { error: "A team must be selected." };
            }
            finalTeamId = formData.teamId;

            const teamLeadsSnapshot = await adminDb.collection('volunteers')
                .where('teamId', '==', formData.teamId)
                .where('isLead', '==', true)
                .limit(1)
                .get();
            
            if (teamLeadsSnapshot.empty) {
                return { error: "The selected team does not have a designated Team Lead. Please assign one." };
            }
            const leadDoc = teamLeadsSnapshot.docs[0];
            finalAssigneeId = leadDoc.id;
            finalAssigneeName = leadDoc.data().fullName;
        } else {
            if (!formData.assigneeId) {
                return { error: "An assignee is required." };
            }
            finalAssigneeId = formData.assigneeId;

            const assigneeDoc = await adminDb.collection('volunteers').doc(finalAssigneeId).get();
            if (!assigneeDoc.exists) {
                return { error: "Assignee not found." };
            }
            const assigneeData = assigneeDoc.data() as Volunteer;
            finalAssigneeName = assigneeData.fullName;
            finalTeamId = assigneeData.teamId || null;

            // Authorization checks
            if (role === 'Volunteer' && finalAssigneeId !== uid) {
                return { error: "Volunteers can only assign tasks to themselves." };
            }
            if (role === 'Team Lead') {
                const leadData = creatorDoc.data();
                if (leadData?.teamId !== assigneeData.teamId) {
                    return { error: "Team Leads can only assign tasks to members of their own team." };
                }
            }
        }
        
        const taskData = {
            title: formData.title,
            description: formData.description || '',
            assigneeId: finalAssigneeId,
            assigneeName: finalAssigneeName,
            teamId: finalTeamId,
            dueDate: formData.dueDate ? FieldValue.serverTimestamp.fromDate(formData.dueDate) : null,
        };
        
        if (formData.id) {
            await adminDb.collection('tasks').doc(formData.id).update(taskData);
        } else {
            await adminDb.collection('tasks').add({
                ...taskData,
                status: 'To Do' as TaskStatus,
                createdBy: uid,
                creatorName: creatorName,
                createdAt: FieldValue.serverTimestamp(),
            });
        }
        
        revalidatePath('/volunteer/dashboard');
        return { success: true };
    } catch (error) {
        console.error("Error managing task:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { error: `Failed to save task: ${errorMessage}` };
    }
}


export async function updateTaskStatus(taskId: string, status: TaskStatus, token: string): Promise<{ success?: boolean, error?: string }> {
    const authCheck = await verifyAuthorized(token);
    if (authCheck.error) return { error: authCheck.error };

    try {
        await adminDb.collection('tasks').doc(taskId).update({ status });
        revalidatePath('/volunteer/dashboard');
        return { success: true };
    } catch (error) {
        console.error("Error updating task status:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { error: `Failed to update status: ${errorMessage}` };
    }
}

export async function deleteTask(taskId: string, token: string): Promise<{ success?: boolean, error?: string }> {
    const authCheck = await verifyAuthorized(token);
    if (authCheck.error) return { error: authCheck.error };
    
    // Optional: Add more specific role checks for deletion if needed (e.g., only creator or admin)

    try {
        await adminDb.collection('tasks').doc(taskId).delete();
        revalidatePath('/volunteer/dashboard');
        return { success: true };
    } catch (error) {
        console.error("Error deleting task:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { error: `Failed to delete task: ${errorMessage}` };
    }
}
