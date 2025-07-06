'use client';

import { useEffect, useState } from 'react';
import type { Team, Volunteer, UserRole } from '@/types';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getDashboardData, manageTeam, assignVolunteerTeam, updateVolunteerLeadStatus } from '@/app/volunteer/dashboard/actions';
import { Loader2, Plus, Users, Crown, Phone } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { VolunteerDetailsDialog } from './volunteer-details-dialog';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
    const [updatingState, setUpdatingState] = useState<{ id: string; type: 'team' | 'lead' } | null>(null);
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
    
    const handleTeamChange = async (volunteerId: string, newTeamId: string) => {
        if (!user) return;
        setUpdatingState({ id: volunteerId, type: 'team' });
        const token = await user.getIdToken();
        const finalTeamId = newTeamId === 'unassigned' ? null : newTeamId;
        const result = await assignVolunteerTeam(volunteerId, finalTeamId, token);
        if (result.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Success', description: `Team assignment updated.` });
            fetchData(); // Refetch to get updated lists
        }
        setUpdatingState(null);
    };

    const handleLeadToggle = async (volunteerId: string, isLead: boolean) => {
        if (!user) return;
        setUpdatingState({ id: volunteerId, type: 'lead' });
        const token = await user.getIdToken();
        const result = await updateVolunteerLeadStatus(volunteerId, isLead, token);
        if (result.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Success', description: `Lead status updated.` });
            fetchData(); // Refetch to sort leads to top
        }
        setUpdatingState(null);
    };

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

    const renderVolunteerTable = (key: string, title: string, description: string, volunteerList: Volunteer[]) => (
        <Card key={key}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Users /> {title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-lg border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Volunteer</TableHead>
                                <TableHead>Job Title</TableHead>
                                {isAdmin && <TableHead>Assign Team</TableHead>}
                                {isAdmin && <TableHead>Team Lead</TableHead>}
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {volunteerList.length > 0 ? volunteerList.map(v => (
                                <TableRow key={v.id} onClick={() => handleOpenDetails(v)} className="cursor-pointer">
                                    <TableCell>
                                        <div className="font-medium flex items-center gap-2">
                                            {v.isLead && <Crown className="h-4 w-4 text-amber-500" />}
                                            {v.fullName}
                                        </div>
                                        <div className="text-sm text-muted-foreground">{v.email}</div>
                                    </TableCell>
                                    <TableCell>{v.jobTitle}</TableCell>
                                    {isAdmin && (
                                        <>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center gap-2">
                                                    <Select 
                                                        onValueChange={(newTeamId) => handleTeamChange(v.id, newTeamId)} 
                                                        value={v.teamId || 'unassigned'}
                                                        disabled={updatingState?.id === v.id}
                                                    >
                                                        <SelectTrigger className="w-full sm:w-[180px]">
                                                            <SelectValue placeholder="Select a team" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="unassigned">Unassigned</SelectItem>
                                                            {teams.map(t => (
                                                                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                     {updatingState?.id === v.id && updatingState?.type === 'team' && <Loader2 className="h-4 w-4 animate-spin" />}
                                                </div>
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={v.isLead || false}
                                                        onCheckedChange={(isChecked) => handleLeadToggle(v.id, isChecked)}
                                                        disabled={updatingState?.id === v.id}
                                                    />
                                                    {updatingState?.id === v.id && updatingState?.type === 'lead' && <Loader2 className="h-4 w-4 animate-spin" />}
                                                </div>
                                            </TableCell>
                                        </>
                                    )}
                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                        <Button asChild variant="outline" size="sm">
                                            <a href={`tel:${v.phone}`}><Phone className="mr-2 h-3 w-3" /> Call</a>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={isAdmin ? 5 : 3} className="h-24 text-center">
                                        No volunteers here.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );

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
                    return renderVolunteerTable(team.id, team.name, `${members.length} member(s)`, members);
                })}

                {renderVolunteerTable("unassigned", "Unassigned Volunteers", `${unassignedVolunteers.length} member(s) not in any team`, unassignedVolunteers)}
            </div>
            {selectedVolunteer && (
                <VolunteerDetailsDialog
                    isOpen={isDetailsOpen}
                    onOpenChange={setIsDetailsOpen}
                    volunteer={selectedVolunteer}
                    teams={teams}
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
