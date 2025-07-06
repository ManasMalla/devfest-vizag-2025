'use client';

import { useState, useEffect } from 'react';
import type { Volunteer, Team } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { assignVolunteerTeam, updateVolunteerLeadStatus, deleteTeam, manageTeam } from '@/app/volunteer/dashboard/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Mail, Phone, Briefcase, Users, Crown, Trash2, Pencil } from 'lucide-react';
import { Separator } from './ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Input } from './ui/input';

interface VolunteerDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  volunteer: Volunteer;
  teams: Team[];
  isAdmin: boolean;
  token: Promise<string> | undefined;
  onFormSubmit: () => void;
}

const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string | React.ReactNode }) => (
    <div className="flex items-start gap-4">
        <Icon className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />
        <div className="flex flex-col">
            <p className="text-sm font-medium">{label}</p>
            <div className="text-sm text-muted-foreground">{value}</div>
        </div>
    </div>
);

export function VolunteerDetailsDialog({ isOpen, onOpenChange, volunteer, teams, isAdmin, token, onFormSubmit }: VolunteerDetailsDialogProps) {
  const [teamId, setTeamId] = useState<string | null>(volunteer.teamId || null);
  const [isLead, setIsLead] = useState(volunteer.isLead || false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentTeamName, setCurrentTeamName] = useState('');
  const [isEditingTeamName, setIsEditingTeamName] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    setTeamId(volunteer.teamId || null);
    setIsLead(volunteer.isLead || false);
    const team = teams.find(t => t.id === volunteer.teamId);
    setCurrentTeamName(team?.name || '');
  }, [volunteer, teams]);

  const handleUpdate = async (updateAction: () => Promise<{ success?: boolean, error?: string }>, successMessage: string) => {
    if (!token) return;
    setIsUpdating(true);
    const resolvedToken = await token;
    const result = await updateAction();
    if (result.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
        toast({ title: 'Success', description: successMessage });
        onFormSubmit(); // Refetch data on the parent
    }
    setIsUpdating(false);
  };
  
  const handleTeamChange = async (newTeamId: string) => {
    const finalTeamId = newTeamId === 'unassigned' ? null : newTeamId;
    setTeamId(finalTeamId);
    handleUpdate(
        () => assignVolunteerTeam(volunteer.id, finalTeamId, (token ? await token : '')),
        `${volunteer.fullName} assigned to a new team.`
    );
  };

  const handleLeadToggle = async (checked: boolean) => {
    setIsLead(checked);
    handleUpdate(
        () => updateVolunteerLeadStatus(volunteer.id, checked, (token ? await token : '')),
        `Lead status for ${volunteer.fullName} updated.`
    );
  };

  const handleDeleteTeam = async (teamIdToDelete: string) => {
    handleUpdate(
        () => deleteTeam(teamIdToDelete, (token ? await token : '')),
        `Team deleted successfully.`
    );
    if(volunteer.teamId === teamIdToDelete) {
        setTeamId(null);
    }
  };

  const handleRenameTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !currentTeamName) return;
     handleUpdate(
        () => manageTeam({ id: teamId, name: currentTeamName }, (token ? await token : '')),
        `Team renamed to "${currentTeamName}".`
    );
    setIsEditingTeamName(false);
  }

  const volunteerTeam = teams.find(t => t.id === volunteer.teamId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
             {volunteer.fullName}
             {volunteer.isLead && <Crown className="h-5 w-5 text-amber-500" />}
          </DialogTitle>
          <DialogDescription>Volunteer Details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <DetailItem icon={Mail} label="Email" value={volunteer.email} />
            <DetailItem icon={Phone} label="Phone" value={volunteer.phone} />
            <DetailItem icon={Briefcase} label="Accepted Role" value={volunteer.jobTitle} />
            <DetailItem icon={Users} label="Current Team" value={volunteerTeam?.name || 'Unassigned'} />
        </div>

        {isAdmin && (
          <>
            <Separator />
            <div className="space-y-4 pt-4">
              <h3 className="text-base font-semibold">Admin Controls</h3>
              <div className="space-y-2">
                <Label htmlFor="team-assignment">Assign to Team</Label>
                <div className="flex items-center gap-2">
                  <Select onValueChange={handleTeamChange} value={teamId || 'unassigned'} disabled={isUpdating}>
                      <SelectTrigger id="team-assignment">
                          <SelectValue placeholder="Select a team" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {teams.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                  {teamId && !isEditingTeamName && (
                    <>
                        <Button variant="outline" size="icon" onClick={() => setIsEditingTeamName(true)}><Pencil className="h-4 w-4" /></Button>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Delete Team?</AlertDialogTitle></AlertDialogHeader>
                                <AlertDialogDescription>
                                    This will permanently delete the "{currentTeamName}" team and unassign all its members. This action cannot be undone.
                                </AlertDialogDescription>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteTeam(teamId)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                  )}
                </div>
                {isEditingTeamName && teamId && (
                    <form onSubmit={handleRenameTeam} className="flex items-center gap-2 mt-2">
                        <Input value={currentTeamName} onChange={e => setCurrentTeamName(e.target.value)} />
                        <Button type="submit">Save</Button>
                        <Button type="button" variant="ghost" onClick={() => setIsEditingTeamName(false)}>Cancel</Button>
                    </form>
                )}
              </div>
              <div className="flex items-center space-x-2">
                  <Switch id="is-lead" checked={isLead} onCheckedChange={handleLeadToggle} disabled={isUpdating} />
                  <Label htmlFor="is-lead">Team Lead</Label>
              </div>
               {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
          </>
        )}
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
