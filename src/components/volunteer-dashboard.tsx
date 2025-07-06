'use client';

import { useEffect, useState } from 'react';
import type { Team, Volunteer, UserRole } from '@/types';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getDashboardData, manageTeam } from '@/app/volunteer/dashboard/actions';
import { Loader2, Plus, Users, Crown, Phone, Mail } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { VolunteerDetailsDialog } from './volunteer-details-dialog';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

export default function VolunteerDashboard() {
    const [user, loading] = useAuthState(auth);
    const [data, setData] = useState<{ teams: Team[], volunteers: Volunteer[] } | null>(null);
    const [role, setRole] = useState<UserRole>('Attendee');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isTeamFormOpen, setIsTeamFormOpen] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [isSubmittingTeam, setIsSubmittingTeam] = useState(false);
    const { toast } = useToast();

    const fetchData = async () => {
        if (!user) {
            setIsLoading(false);
            setError('You must be signed in to view this page.');
            return;
        }
        setIsLoading(true);
        try {
            const token = await user.getIdToken();
            const result = await getDashboardData(token);
            if (result.error) {
                setError(result.error);
            } else if (result.data) {
                setData(result.data);
                setRole(result.data.role);
            }
        } catch (e: any) {
            setError(e.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!loading) {
            fetchData();
        }
    }, [user, loading]);

    const handleOpenDetails = (volunteer: Volunteer) => {
        setSelectedVolunteer(volunteer);
        setIsDetailsOpen(true);
    };

    const handleFormSubmit = () => {
        // Refetch data when a change is made in the details dialog
        fetchData();
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !teamName) return;
        setIsSubmittingTeam(true);
        const token = await user.getIdToken();
        const result = await manageTeam({ name: teamName }, token);
        if (result.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Success', description: `Team "${teamName}" created.` });
            setTeamName('');
            setIsTeamFormOpen(false);
            fetchData();
        }
        setIsSubmittingTeam(false);
    }

    if (isLoading) {
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

    if (!data) return null;

    const { teams, volunteers } = data;
    const isAdmin = role === 'Admin';

    const unassignedVolunteers = volunteers.filter(v => !v.teamId);

    return (
        <div>
            {isAdmin && (
                <div className="flex justify-end mb-6">
                    <Button onClick={() => setIsTeamFormOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Create Team
                    </Button>
                </div>
            )}
            <div className="space-y-8">
                {teams.map(team => {
                    const members = volunteers
                        .filter(v => v.teamId === team.id)
                        .sort((a, b) => (b.isLead ? 1 : 0) - (a.isLead ? 1 : 0));
                    return (
                        <Card key={team.id}>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Users /> {team.name}</CardTitle>
                                <CardDescription>{members.length} member(s)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {members.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {members.map(v => (
                                            <div key={v.id} onClick={() => handleOpenDetails(v)} className="p-4 rounded-lg border bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
                                                <div className="font-semibold flex items-center gap-2">
                                                    {v.isLead && <Crown className="h-4 w-4 text-amber-500" />} {v.fullName}
                                                </div>
                                                <p className="text-sm text-muted-foreground">{v.jobTitle}</p>
                                                <div className="flex items-center gap-4 mt-2">
                                                    <Button asChild variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                                                        <a href={`tel:${v.phone}`}><Phone className="mr-2 h-3 w-3" /> Call</a>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No volunteers in this team yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Users /> Unassigned Volunteers</CardTitle>
                         <CardDescription>{unassignedVolunteers.length} member(s)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {unassignedVolunteers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {unassignedVolunteers.map(v => (
                                    <div key={v.id} onClick={() => handleOpenDetails(v)} className="p-4 rounded-lg border bg-background hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
                                        <div className="font-semibold flex items-center gap-2">
                                            {v.isLead && <Crown className="h-4 w-4 text-amber-500" />} {v.fullName}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{v.jobTitle}</p>
                                        <div className="flex items-center gap-4 mt-2">
                                            <Button asChild variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
                                               <a href={`tel:${v.phone}`}><Phone className="mr-2 h-3 w-3" /> Call</a>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">All volunteers have been assigned to a team.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
            {selectedVolunteer && user && (
                <VolunteerDetailsDialog
                    isOpen={isDetailsOpen}
                    onOpenChange={setIsDetailsOpen}
                    volunteer={selectedVolunteer}
                    teams={teams}
                    isAdmin={isAdmin}
                    token={user ? user.getIdToken() : undefined}
                    onFormSubmit={handleFormSubmit}
                />
            )}
             <Dialog open={isTeamFormOpen} onOpenChange={setIsTeamFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Team</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateTeam}>
                        <div className="py-4">
                            <Label htmlFor="team-name">Team Name</Label>
                            <Input
                                id="team-name"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                placeholder="e.g., Marketing Team"
                            />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" disabled={isSubmittingTeam}>Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmittingTeam || !teamName}>
                                {isSubmittingTeam && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}