'use client';

import { useState } from 'react';
import type { Job, ClientJobApplication } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { JobFormDialog } from './job-form-dialog';
import { deleteJob, updateJobStatus } from '@/app/volunteer/actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApplicationsList } from './applications-list';
import { Switch } from '@/components/ui/switch';


interface AdminDashboardProps {
  initialJobs: Job[];
  initialApplications: ClientJobApplication[];
  initialNextCursor: string | null;
  token: string;
}

export default function AdminDashboard({ initialJobs, initialApplications, initialNextCursor, token }: AdminDashboardProps) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const { toast } = useToast();

  const handleAdd = () => {
    setSelectedJob(null);
    setIsFormOpen(true);
  };

  const handleEdit = (job: Job) => {
    setSelectedJob(job);
    setIsFormOpen(true);
  };
  
  const handleDelete = async (jobId: string) => {
    const result = await deleteJob(jobId, token);
    if (result.success) {
      setJobs(jobs.filter((job) => job.id !== jobId));
      toast({ title: "Success", description: result.success });
    } else {
      toast({ variant: 'destructive', title: "Error", description: result.error });
    }
  };

  const handleStatusToggle = async (job: Job) => {
    const newStatus = (job.status ?? 'open') === 'open' ? 'closed' : 'open';
    const result = await updateJobStatus(job.id, newStatus, token);

    if (result.success) {
      setJobs(currentJobs => currentJobs.map(j => 
        j.id === job.id ? { ...j, status: newStatus } : j
      ));
      toast({ title: "Success", description: result.success });
    } else {
      toast({ variant: 'destructive', title: "Error", description: result.error });
    }
  };

  const onFormSubmit = (submittedJob: Job) => {
    const jobExists = jobs.some((j) => j.id === submittedJob.id);
    let newJobs;
    if (jobExists) {
      // Update existing job
      newJobs = jobs.map((j) => (j.id === submittedJob.id ? submittedJob : j));
    } else {
      // Add new job
      newJobs = [...jobs, submittedJob];
    }
    // Re-sort the list by title to maintain consistency with initial fetch
    newJobs.sort((a, b) => a.title.localeCompare(b.title));
    setJobs(newJobs);
    setSelectedJob(null);
  };

  return (
     <Tabs defaultValue="applications" className="w-full">
      <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
        <TabsTrigger value="applications">Applications</TabsTrigger>
        <TabsTrigger value="jobs">Job Postings</TabsTrigger>
      </TabsList>
      <TabsContent value="applications" className="mt-6">
        <ApplicationsList 
          initialApplications={initialApplications}
          initialNextCursor={initialNextCursor}
          jobs={initialJobs}
          token={token} 
        />
      </TabsContent>
      <TabsContent value="jobs" className="mt-6">
        <div className="flex justify-end mb-4">
          <Button onClick={handleAdd}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Job
          </Button>
        </div>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>
                    <Badge variant={job.category === 'Lead' ? 'default' : 'secondary'}>
                      {job.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                       <Switch
                        id={`status-switch-${job.id}`}
                        checked={(job.status ?? 'open') === 'open'}
                        onCheckedChange={() => handleStatusToggle(job)}
                        aria-label={`Toggle status for ${job.title}`}
                       />
                       <Badge variant={(job.status ?? 'open') === 'open' ? 'secondary' : 'destructive'}>
                          {(job.status ?? 'open') === 'open' ? 'Open' : 'Closed'}
                       </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(job)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the job posting.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(job.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <JobFormDialog
          isOpen={isFormOpen}
          setIsOpen={setIsFormOpen}
          job={selectedJob}
          token={token}
          onFormSubmit={onFormSubmit}
        />
      </TabsContent>
    </Tabs>
  );
}
