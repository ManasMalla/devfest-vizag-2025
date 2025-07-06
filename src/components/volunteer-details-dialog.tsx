'use client';

import type { Volunteer, Team } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Mail, Phone, Briefcase, Users, Crown } from 'lucide-react';

interface VolunteerDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  volunteer: Volunteer;
  teams: Team[];
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

export function VolunteerDetailsDialog({ isOpen, onOpenChange, volunteer, teams }: VolunteerDetailsDialogProps) {

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
            <DetailItem icon={Mail} label="Email" value={<a href={`mailto:${volunteer.email}`} className="hover:underline">{volunteer.email}</a>} />
            <DetailItem icon={Phone} label="Phone" value={<a href={`tel:${volunteer.phone}`} className="hover:underline">{volunteer.phone}</a>} />
            <DetailItem icon={Briefcase} label="Accepted Role" value={volunteer.jobTitle} />
            <DetailItem icon={Users} label="Current Team" value={volunteerTeam?.name || 'Unassigned'} />
        </div>
        
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
