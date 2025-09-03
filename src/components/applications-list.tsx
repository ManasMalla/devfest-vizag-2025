'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MoreHorizontal, Loader2 } from 'lucide-react';
import type { ClientJobApplication, ApplicationStatus, Job } from '@/types';
import { updateApplicationStatus, getApplications } from '@/app/volunteer/actions';
import { useToast } from '@/hooks/use-toast';
import { ApplicationDetailsDialog } from './application-details-dialog';
import { Skeleton } from './ui/skeleton';

const ITEMS_PER_PAGE = 10;
const statusFilters: (ApplicationStatus | 'All')[] = ['All', 'Applied', 'Shortlisted', 'Accepted', 'Rejected'];

interface ApplicationsListProps {
  initialApplications: ClientJobApplication[];
  initialNextCursor: string | null;
  jobs: Job[];
  token: string;
}

const getAvailableActions = (status: ApplicationStatus): ApplicationStatus[] => {
  switch (status) {
    case 'Applied': return ['Shortlisted', 'Rejected'];
    case 'Shortlisted': return ['Accepted', 'Rejected'];
    case 'Rejected': return ['Applied', 'Shortlisted'];
    case 'Accepted': return [];
    default: return [];
  }
};

export function ApplicationsList({ initialApplications, initialNextCursor, jobs, token }: ApplicationsListProps) {
  const [applications, setApplications] = useState<ClientJobApplication[]>(initialApplications);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'All'>('All');
  const [jobTitleFilter, setJobTitleFilter] = useState<string | 'All'>('All');
  
  const [isLoading, setIsLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  const [prevCursors, setPrevCursors] = useState<(string | undefined)[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);

  const [selectedApp, setSelectedApp] = useState<ClientJobApplication | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();
  const isInitialMount = useRef(true);

  const fetchApps = useCallback(async (cursor: string | undefined, direction: 'next' | 'prev' | 'reset') => {
    setIsLoading(true);
    try {
      const result = await getApplications(
        token,
        { status: statusFilter, jobTitle: jobTitleFilter },
        { limit: ITEMS_PER_PAGE, startAfterDocId: cursor }
      );
      setApplications(result.applications);
      setNextCursor(result.nextCursor);

      if (direction === 'next') {
        setPrevCursors(prev => [...prev, cursor]);
      } else if (direction === 'prev') {
        setPrevCursors(prev => prev.slice(0, -1));
      } else if (direction === 'reset') {
        setPrevCursors([]);
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Error', description: e.message || 'Failed to fetch applications. A composite index in Firestore may be required.' });
    } finally {
      setIsLoading(false);
    }
  }, [token, statusFilter, jobTitleFilter, toast]);

  useEffect(() => {
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }
    fetchApps(undefined, 'reset');
  }, [statusFilter, jobTitleFilter, fetchApps]);


  const handleStatusFilterChange = (value: ApplicationStatus | 'All') => {
    setStatusFilter(value);
  };

  const handleJobFilterChange = (value: string | 'All') => {
    setJobTitleFilter(value);
  };

  const handleViewDetails = (application: ClientJobApplication) => {
    setSelectedApp(application);
    setIsDetailsOpen(true);
  };

  const handleStatusUpdate = (applicationId: string, newStatus: ApplicationStatus) => {
    setApplications((prevApps) =>
      prevApps.map((app) =>
        app.id === applicationId ? { ...app, status: newStatus } : app
      )
    );
  };

  const handleQuickStatusUpdate = async (applicationId: string, newStatus: ApplicationStatus, e: React.MouseEvent) => {
    e.stopPropagation();
    setUpdatingId(applicationId);
    const result = await updateApplicationStatus(applicationId, newStatus, token);
    if (result.success) {
      handleStatusUpdate(applicationId, newStatus);
      toast({ title: 'Success', description: result.success });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setUpdatingId(null);
  };

  const getBadgeVariant = (status: ApplicationStatus) => {
    switch (status) {
      case 'Accepted': return 'default';
      case 'Shortlisted': return 'secondary';
      case 'Rejected': return 'destructive';
      case 'Applied': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
        <p className="text-sm font-medium">Filter by:</p>
        <Select onValueChange={handleStatusFilterChange} defaultValue="All">
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {statusFilters.map((status) => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={handleJobFilterChange} defaultValue="All">
          <SelectTrigger className="w-full sm:w-[280px]">
            <SelectValue placeholder="Job Title" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Jobs</SelectItem>
            {jobs.map((job) => (
              <SelectItem key={job.id} value={job.title}>{job.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                 <TableRow key={`skel-${i}`}>
                    <TableCell colSpan={5}>
                        <Skeleton className="h-10 w-full" />
                    </TableCell>
                </TableRow>
              ))
            ) : applications.length > 0 ? (
              applications.map((app) => (
                <TableRow key={app.id} onClick={() => handleViewDetails(app)} className="cursor-pointer">
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
                          <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          {getAvailableActions(app.status).map((action) => (
                            <DropdownMenuItem key={action} onClick={(e) => handleQuickStatusUpdate(app.id, action, e)}>
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
                  No applications found for the selected filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
            variant="outline"
            size="sm"
            onClick={() => fetchApps(prevCursors[prevCursors.length - 1], 'prev')}
            disabled={prevCursors.length === 0 || isLoading}
        >
            Previous
        </Button>
        <Button
            variant="outline"
            size="sm"
            onClick={() => fetchApps(nextCursor!, 'next')}
            disabled={!nextCursor || isLoading}
        >
            Next
        </Button>
      </div>
      <ApplicationDetailsDialog
        application={selectedApp}
        isOpen={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        onStatusChange={handleStatusUpdate}
        token={token}
      />
    </div>
  );
}
