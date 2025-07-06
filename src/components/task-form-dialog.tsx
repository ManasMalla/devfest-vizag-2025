'use client';

import { useEffect, useState, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { Task, Volunteer, Team, UserRole } from '@/types';
import { manageTask } from '@/app/volunteer/dashboard/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TaskFormDialogProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    task: Task | null;
    volunteers: Volunteer[];
    teams: Team[];
    currentUser: { role: UserRole; uid: string; teamId: string | null };
    token: string;
    onTaskUpdate: () => void;
}

const TaskFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  description: z.string().optional(),
  assigneeId: z.string({ required_error: "An assignee is required." }),
  dueDate: z.date().optional().nullable(),
});

export function TaskFormDialog({ isOpen, setIsOpen, task, volunteers, teams, currentUser, token, onTaskUpdate }: TaskFormDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof TaskFormSchema>>({
    resolver: zodResolver(TaskFormSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (task) {
        form.reset({
          title: task.title,
          description: task.description,
          assigneeId: task.assigneeId,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
        });
      } else {
        form.reset({
          title: '',
          description: '',
          assigneeId: currentUser.role === 'Volunteer' ? currentUser.uid : undefined,
          dueDate: null,
        });
      }
    }
  }, [task, form, isOpen, currentUser]);

  const assignableVolunteers = useMemo(() => {
    if (currentUser.role === 'Admin') {
      return volunteers;
    }
    if (currentUser.role === 'Team Lead') {
      return volunteers.filter(v => v.teamId === currentUser.teamId);
    }
    if (currentUser.role === 'Volunteer') {
      return volunteers.filter(v => v.id === currentUser.uid);
    }
    return [];
  }, [volunteers, currentUser]);

  const assigneeOptionsByTeam = useMemo(() => {
      if (currentUser.role !== 'Admin') return [];
      const grouped: { [key: string]: Volunteer[] } = {};
      assignableVolunteers.forEach(v => {
          const teamId = v.teamId || 'unassigned';
          if (!grouped[teamId]) {
              grouped[teamId] = [];
          }
          grouped[teamId].push(v);
      });
      const teamIdToName = teams.reduce((acc, team) => ({...acc, [team.id]: team.name}), {} as Record<string, string>);
      
      return Object.entries(grouped).map(([teamId, members]) => ({
          id: teamId,
          name: teamIdToName[teamId] || 'Unassigned',
          members
      }));
  }, [assignableVolunteers, teams, currentUser.role]);

  async function onSubmit(values: z.infer<typeof TaskFormSchema>) {
    setIsSubmitting(true);
    const assignee = volunteers.find(v => v.id === values.assigneeId);
    const result = await manageTask({ 
        ...values,
        id: task?.id,
        teamId: assignee?.teamId || null,
    }, token);

    if (result.success) {
      toast({ title: 'Success', description: `Task ${task ? 'updated' : 'created'} successfully.` });
      onTaskUpdate();
      setIsOpen(false);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsSubmitting(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Update the details for this task.' : 'Fill out the form to create a new task.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Design social media posts" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add more details about the task..." className="min-h-[100px]" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assigneeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign To</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={currentUser.role === 'Volunteer'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a volunteer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {currentUser.role === 'Admin' ? (
                        assigneeOptionsByTeam.map(group => (
                          <SelectGroup key={group.id}>
                            <Label className="px-2 py-1.5 text-xs font-semibold">{group.name}</Label>
                            {group.members.map(v => <SelectItem key={v.id} value={v.id}>{v.fullName}</SelectItem>)}
                          </SelectGroup>
                        ))
                      ) : (
                        assignableVolunteers.map(v => <SelectItem key={v.id} value={v.id}>{v.fullName}</SelectItem>)
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Due Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-[240px] pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ?? undefined}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
               <Button type="button" variant="secondary" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {task ? 'Save Changes' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
