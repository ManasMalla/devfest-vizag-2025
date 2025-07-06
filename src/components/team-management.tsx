'use client';

import { useState } from 'react';
import type { Team, Volunteer, UserRole } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Users, Crown, Phone, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VolunteerDetailsDialog } from './volunteer-details-dialog';
import { assignVolunteerTeam, updateVolunteerLeadStatus, manageTeam, deleteTeam } from '@/app/volunteer/dashboard/actions';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';


interface TeamManagementProps {
    teams: Team[];
    volunteers: Volunteer[];
    currentUser: { role: UserRole; uid: string; teamId: string | null; };
    token: string;
    onTeamUpdate: () => void;
}

export function TeamManagement({ teams, volunteers, currentUser, token, onTeamUpdate }: TeamManagementProps) {
    const { toast } = useToast();
    const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isTeamFormOpen, setIsTeamFormOpen] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [isSubmittingTeam, setIsSubmittingTeam] = useState(false);
    const [updatingState, setUpdatingState] = useState<{ id: string; type: 'team' | 'lead' } | null>(null);
    
    const isAdmin = currentUser.role === 'Admin';
    const unassignedVolunteers = volunteers.filter(v => !v.teamId);

    const handleOpenDetails = (volunteer: Volunteer) => {
        setSelectedVolunteer(volunteer);
        setIsDetailsOpen(true);
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!teamName) return;
        setIsSubmittingTeam(true);
        const result = await manageTeam({ name: teamName }, token);
        if (result.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Success', description: `Team "${teamName}" created.` });
            setTeamName('');
            setIsTeamFormOpen(false);
            onTeamUpdate();
        }
        setIsSubmittingTeam(false);
    }

    const handleDeleteTeam = async (teamId: string) => {
        const result = await deleteTeam(teamId, token);
        if (result.error) {
             toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Success', description: 'Team deleted successfully.' });
            onTeamUpdate();
        }
    }

    const handleTeamChange = async (volunteerId: string, newTeamId: string) => {
        setUpdatingState({ id: volunteerId, type: 'team' });
        const finalTeamId = newTeamId === 'unassigned' ? null : newTeamId;
        const result = await assignVolunteerTeam(volunteerId, finalTeamId, token);
        if (result.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Success', description: `Team assignment updated.` });
            onTeamUpdate();
        }
        setUpdatingState(null);
    };

    const handleLeadToggle = async (volunteerId: string, isLead: boolean) => {
        setUpdatingState({ id: volunteerId, type: 'lead' });
        const result = await updateVolunteerLeadStatus(volunteerId, isLead, token);
        if (result.error) {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        } else {
            toast({ title: 'Success', description: `Lead status updated.` });
            onTeamUpdate();
        }
        setUpdatingState(null);
    };

    const renderVolunteerTable = (key: string, title: string, description: string, volunteerList: Volunteer[], teamId: string | null = null) => (
        <Card key={key}>
            <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2"><Users /> {title}</div>
                    {isAdmin && teamId && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete "{title}"?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will unassign all members from this team. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteTeam(teamId)} className="bg-destructive hover:bg-destructive/90">
                                        Delete Team
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </CardTitle>
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
                            {volunteerList.length > 0 ? volunteerList
                                .sort((a, b) => (b.isLead ? 1 : 0) - (a.isLead ? 1 : 0))
                                .map(v => (
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
                    const members = volunteers.filter(v => v.teamId === team.id);
                    return renderVolunteerTable(team.id, team.name, `${members.length} member(s)`, members, team.id);
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
