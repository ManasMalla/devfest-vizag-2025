'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import type { ClientJobApplication, ApplicationStatus } from '@/types';
import { updateApplicationStatus } from '@/app/volunteer/actions';
import { useToast } from '@/hooks/use-toast';

interface ApplicationsListProps {
  initialApplications: ClientJobApplication[];
  token: string;
}

const statusFilters: (ApplicationStatus | 'All')[] = ['All', 'Applied', 'Shortlisted', 'Accepted', 'Rejected'];

const getAvailableActions = (status: ApplicationStatus): ApplicationStatus[] => {
  switch (status) {
    case 'Applied':
      return ['Shortlisted', 'Rejected'];
    case 'Shortlisted':
      return ['Accepted', 'Rejected'];
    case 'Rejected':
      return ['Applied', 'Shortlisted'];
    case 'Accepted':
      return []; // No further actions
    default:
      return [];
  }
};

export function ApplicationsList({ initialApplications, token }: ApplicationsListProps) {
  const [applications, setApplications] = useState<ClientJobApplication[]>(initialApplications);
  const [filter, setFilter] = useState<ApplicationStatus | 'All'>('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  const filteredApplications = useMemo(() => {
    if (filter === 'All') {
      return applications;
    }
    return applications.filter((app) => app.status === filter);
  }, [applications, filter]);

  const handleStatusUpdate = async (applicationId: string, newStatus: ApplicationStatus) => {
    setUpdatingId(applicationId);
    const result = await updateApplicationStatus(applicationId, newStatus, token);
    if (result.success) {
      setApplications((prevApps) =>
        prevApps.map((app) =>
          app.id === applicationId ? { ...app, status: newStatus } : app
        )
      );
      toast({ title: 'Success', description: result.success });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setUpdatingId(null);
  };

  const getBadgeVariant = (status: ApplicationStatus) => {
    switch (status) {
      case 'Accepted':
        return 'default';
      case 'Shortlisted':
        return 'secondary';
      case 'Rejected':
        return 'destructive';
      case 'Applied':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <p className="text-sm font-medium">Filter by status:</p>
        {statusFilters.map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status}
          </Button>
        ))}
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredApplications.length > 0 ? (
              filteredApplications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell>
                    <div className="font-medium">{app.fullName}</div>
                    <div className="text-sm text-muted-foreground">{app.userEmail}</div>
                  </TableCell>
                  <TableCell>{app.jobTitle}</TableCell>
                  <TableCell>{format(new Date(app.submittedAt), 'PP')}</TableCell>
                  <TableCell>
                    <Badge variant={getBadgeVariant(app.status)}>{app.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {updatingId === app.id ? (
                      <Loader2 className="h-4 w-4 animate-spin ml-auto" />
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {getAvailableActions(app.status).map((action) => (
                            <DropdownMenuItem
                              key={action}
                              onClick={() => handleStatusUpdate(app.id, action)}
                            >
                              {action}
                            </DropdownMenuItem>
                          ))}
                           {getAvailableActions(app.status).length === 0 && (
                             <DropdownMenuItem disabled>No actions available</DropdownMenuItem>
                           )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No applications found for this filter.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
