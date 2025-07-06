'use client'

import { useState, useMemo } from 'react';
import type { Task, Team, Volunteer, UserRole } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Plus, ChevronDown, Trash2 } from 'lucide-react';
import { TaskFormDialog } from './task-form-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Badge } from './ui/badge';
import { format } from 'date-fns';
import { deleteTask, updateTaskStatus } from '@/app/volunteer/dashboard/actions';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';

interface TaskListProps {
    tasks: Task[];
    teams: Team[];
    volunteers: Volunteer[];
    currentUser: { role: UserRole; uid: string; teamId: string | null };
    token: string;
    onTaskUpdate: () => void;
}

export function TaskList({ tasks, teams, volunteers, currentUser, token, onTaskUpdate }: TaskListProps) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const { toast } = useToast();

    const handleEditTask = (task: Task) => {
        setSelectedTask(task);
        setIsFormOpen(true);
    };

    const handleCreateTask = () => {
        setSelectedTask(null);
        setIsFormOpen(true);
    };

    const handleDeleteTask = async (taskId: string) => {
        const result = await deleteTask(taskId, token);
        if (result.success) {
            toast({ title: "Task Deleted", description: "The task has been removed." });
            onTaskUpdate();
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
    };

    const handleStatusChange = async (taskId: string, status: Task['status']) => {
        const result = await updateTaskStatus(taskId, status, token);
         if (result.success) {
            toast({ title: "Status Updated", description: "The task status has been changed." });
            onTaskUpdate();
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
    }

    const getStatusVariant = (status: Task['status']) => {
        switch (status) {
            case 'Done': return 'default';
            case 'In Progress': return 'secondary';
            case 'To Do': return 'outline';
            default: return 'outline';
        }
    }
    
    const taskGroups = useMemo(() => {
        const allTeams = [...teams, { id: 'unassigned', name: 'Unassigned' }];
        
        return allTeams.map(team => {
            const teamTasks = tasks.filter(task => (task.teamId || 'unassigned') === team.id)
                .sort((a, b) => {
                    // Prioritize user's own tasks
                    const aIsMine = a.assigneeId === currentUser.uid;
                    const bIsMine = b.assigneeId === currentUser.uid;
                    if (aIsMine && !bIsMine) return -1;
                    if (!aIsMine && bIsMine) return 1;
                    // Then sort by due date
                    if (a.dueDate && b.dueDate) return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                    if (a.dueDate) return -1;
                    if (b.dueDate) return 1;
                    return 0;
                });
            return { ...team, tasks: teamTasks };
        });
    }, [tasks, teams, currentUser.uid]);


    return (
        <div>
            <div className="flex justify-end mb-6">
                <Button onClick={handleCreateTask}>
                    <Plus className="mr-2 h-4 w-4" /> Create Task
                </Button>
            </div>
            <div className="space-y-6">
                {taskGroups.map(group => group.tasks.length > 0 && (
                    <Card key={group.id}>
                        <CardHeader>
                            <CardTitle>{group.name}</CardTitle>
                            <CardDescription>{group.tasks.length} task(s)</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {group.tasks.map(task => (
                                <Collapsible key={task.id} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Badge variant={getStatusVariant(task.status)} className="cursor-pointer">
                                                        {task.status}
                                                    </Badge>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'To Do')}>To Do</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'In Progress')}>In Progress</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(task.id, 'Done')}>Done</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <span className="font-medium">{task.title}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-sm text-muted-foreground">
                                                <span className="font-semibold">{task.assigneeName}</span>
                                            </div>
                                            <CollapsibleTrigger asChild>
                                                <Button variant="ghost" size="sm" className="w-9 p-0">
                                                    <ChevronDown className="h-4 w-4" />
                                                    <span className="sr-only">Toggle</span>
                                                </Button>
                                            </CollapsibleTrigger>
                                        </div>
                                    </div>
                                    <CollapsibleContent className="space-y-4 mt-4 pt-4 border-t">
                                        {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>
                                                Due: {task.dueDate ? format(new Date(task.dueDate), 'PP') : 'N/A'}
                                            </span>
                                             <span>
                                                Created by: {task.creatorName}
                                            </span>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => handleEditTask(task)}>Edit</Button>
                                             <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Task?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently delete "{task.title}". This cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteTask(task.id)} className="bg-destructive hover:bg-destructive/90">
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
            <TaskFormDialog
                isOpen={isFormOpen}
                setIsOpen={setIsFormOpen}
                task={selectedTask}
                volunteers={volunteers}
                currentUser={currentUser}
                teams={teams}
                token={token}
                onTaskUpdate={onTaskUpdate}
            />
        </div>
    )
}
