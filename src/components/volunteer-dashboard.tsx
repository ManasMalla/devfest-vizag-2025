'use client';

import { useEffect, useState, useCallback } from 'react';
import type { Team, Volunteer, UserRole, Task } from '@/types';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getDashboardData } from '@/app/volunteer/dashboard/actions';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TeamManagement } from '@/components/team-management';
import { TaskList } from '@/components/task-list';

export default function VolunteerDashboard() {
    const [user, loading] = useAuthState(auth);
    const [token, setToken] = useState<string | null>(null);
    const [data, setData] = useState<{ teams: Team[], volunteers: Volunteer[], tasks: Task[] } | null>(null);
    const [currentUser, setCurrentUser] = useState<{ role: UserRole, uid: string, teamId: string | null } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async (userToken: string) => {
        setIsLoading(true);
        try {
            const result = await getDashboardData(userToken);
            if (result.error) {
                setError(result.error);
                setData(null);
                setCurrentUser(null);
            } else if (result.data) {
                setData({ teams: result.data.teams, volunteers: result.data.volunteers, tasks: result.data.tasks });
                setCurrentUser({ role: result.data.role, uid: result.data.uid, teamId: result.data.teamId });
                setError(null);
            }
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (loading) {
            setIsLoading(true);
            return;
        }
        if (!user) {
            setIsLoading(false);
            setError('You must be signed in to view this page.');
            return;
        }
        
        user.getIdToken().then(t => {
            setToken(t);
            fetchData(t);
        });
    }, [user, loading, fetchData]);
    
    const handleDataRefresh = () => {
        if (token) {
            fetchData(token);
        }
    }

    if (isLoading || !data || !currentUser || !token) {
        return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Access Denied</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }
    
    return (
        <Tabs defaultValue="tasks" className="w-full">
            <TabsList className="grid w-full max-w-sm mx-auto grid-cols-2">
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
            </TabsList>
            <TabsContent value="tasks" className="mt-6">
                <TaskList
                    tasks={data.tasks}
                    teams={data.teams}
                    volunteers={data.volunteers}
                    currentUser={currentUser}
                    token={token}
                    onTaskUpdate={handleDataRefresh}
                />
            </TabsContent>
            <TabsContent value="team" className="mt-6">
                <TeamManagement
                    teams={data.teams}
                    volunteers={data.volunteers}
                    currentUser={currentUser}
                    token={token}
                    onTeamUpdate={handleDataRefresh}
                />
            </TabsContent>
        </Tabs>
    );
}
