'use client';

import type { ClientJobApplication } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { Separator } from './ui/separator';
import { Mail, Phone, MessageSquare, Briefcase, Calendar, Hash } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface ApplicationDetailsDialogProps {
  application: ClientJobApplication | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
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


export function ApplicationDetailsDialog({ application, isOpen, onOpenChange }: ApplicationDetailsDialogProps) {
  if (!application) return null;

  const getBadgeVariant = (status: ClientJobApplication['status']) => {
    switch (status) {
      case 'Accepted': return 'default';
      case 'Shortlisted': return 'secondary';
      case 'Rejected': return 'destructive';
      case 'Applied': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Application Details</DialogTitle>
          <DialogDescription>
            Reviewing application from <span className="font-semibold">{application.fullName}</span>.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto min-h-0">
            <ScrollArea className="h-full pr-6">
                <div className="space-y-6 py-4">
                    <div className="space-y-4">
                        <DetailItem icon={Briefcase} label="Applying For" value={application.jobTitle} />
                        <DetailItem icon={Mail} label="Email" value={application.userEmail} />
                        <DetailItem icon={Phone} label="Phone Number" value={application.phone} />
                        <DetailItem icon={MessageSquare} label="WhatsApp" value={application.whatsapp} />
                        <DetailItem icon={Calendar} label="Submitted On" value={format(new Date(application.submittedAt), 'PPP')} />
                        <DetailItem 
                            icon={Hash} 
                            label="Status" 
                            value={<Badge variant={getBadgeVariant(application.status)}>{application.status}</Badge>} 
                        />
                    </div>

                    {application.answers && Object.keys(application.answers).length > 0 && (
                        <>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className="text-base font-semibold">Additional Questions</h3>
                                {Object.entries(application.answers).map(([question, answer]) => (
                                    <div key={question}>
                                        <p className="text-sm font-medium mb-1">{question}</p>
                                        <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-md whitespace-pre-wrap">{answer || 'No answer provided.'}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </ScrollArea>
        </div>
        <DialogFooter className="flex-shrink-0">
          <DialogClose asChild>
            <Button type="button" variant="secondary">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
