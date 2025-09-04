
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { AgendaItem, AgendaTrack, agendaCategories } from '@/types';
import { manageAgendaItem, deleteAgendaItem, getAgenda, getAgendaTracks, manageAgendaTrack, deleteAgendaTrack } from '@/app/agenda/actions';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { Loader2, PlusCircle, MoreHorizontal, Pencil, Trash2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AgendaManagementProps {
  initialAgendaItems: AgendaItem[];
  initialTracks: AgendaTrack[];
  token: string;
}

const AgendaItemSchema = z.object({
  title: z.string().min(3, 'Title is required.'),
  speaker: z.string().optional(),
  description: z.string().optional(),
  trackId: z.string().min(1, 'A track must be selected.'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Start time must be in HH:MM format.'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'End time must be in HH:MM format.'),
  category: z.enum(agendaCategories).optional(),
}).refine(data => data.endTime > data.startTime, {
  message: "End time must be after start time.",
  path: ["endTime"],
});

type AgendaFormValues = z.infer<typeof AgendaItemSchema>;

function AgendaForm({
  isOpen,
  setIsOpen,
  item,
  tracks,
  token,
  onSave,
}: {
  isOpen: boolean,
  setIsOpen: (open: boolean) => void,
  item: AgendaItem | null,
  tracks: AgendaTrack[],
  token: string,
  onSave: () => void,
}) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<AgendaFormValues>({
    resolver: zodResolver(AgendaItemSchema),
    defaultValues: item ? { ...item, trackId: item.trackId } : { title: '', speaker: '', description: '', trackId: '', startTime: '09:00', endTime: '10:00' },
  });

  const onSubmit = async (values: AgendaFormValues) => {
    setIsSubmitting(true);
    const formData = new FormData();
    if (item?.id) {
      formData.append('id', item.id);
    }
    Object.entries(values).forEach(([key, value]) => {
      if (value) {
        formData.append(key, value);
      }
    });

    const result = await manageAgendaItem(formData, token);
    if (result.success) {
      toast({ title: 'Success', description: `Agenda item ${item ? 'updated' : 'created'}.` });
      onSave();
      setIsOpen(false);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
    setIsSubmitting(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? 'Edit Agenda Item' : 'Add Agenda Item'}</DialogTitle>
          <DialogDescription>Fill in the details for the agenda session.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="speaker" render={({ field }) => ( <FormItem><FormLabel>Speaker</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
             <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="trackId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Track</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a track" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tracks.map(track => (
                            <SelectItem key={track.id} value={track.id}>
                              {track.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {agendaCategories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="startTime" render={({ field }) => ( <FormItem><FormLabel>Start Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="endTime" render={({ field }) => ( <FormItem><FormLabel>End Time</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary" disabled={isSubmitting}>Cancel</Button></DialogClose>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

const TrackSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Track name cannot be empty.'),
});
type TrackFormValues = z.infer<typeof TrackSchema>;

export function AgendaManagement({ initialAgendaItems, initialTracks, token }: AgendaManagementProps) {
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>(initialAgendaItems);
  const [tracks, setTracks] = useState<AgendaTrack[]>(initialTracks);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AgendaItem | null>(null);
  const [editingTrack, setEditingTrack] = useState<AgendaTrack | null>(null);
  const { toast } = useToast();
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<TrackFormValues>({
    resolver: zodResolver(TrackSchema),
  });

  const handleRefresh = async () => {
    const [items, newTracks] = await Promise.all([getAgenda(), getAgendaTracks()]);
    setAgendaItems(items);
    setTracks(newTracks);
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: AgendaItem) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteAgendaItem(id, token);
    if (result.success) {
      toast({ title: 'Success', description: 'Agenda item deleted.' });
      handleRefresh();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  const onManageTrack = async (data: TrackFormValues) => {
    const formData = new FormData();
    formData.append('name', data.name);
    if (editingTrack?.id) {
        formData.append('id', editingTrack.id);
    }
    const result = await manageAgendaTrack(formData, token);
    if (result.success) {
        toast({ title: 'Success', description: `Track ${editingTrack ? 'updated' : 'created'}.` });
        reset({ name: '' });
        setEditingTrack(null);
        handleRefresh();
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  };

  const onDeleteTrack = async (id: string) => {
    const result = await deleteAgendaTrack(id, token);
    if (result.success) {
        toast({ title: 'Success', description: 'Track deleted.' });
        handleRefresh();
    } else {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    }
  }

  const handleEditTrack = (track: AgendaTrack) => {
    setEditingTrack(track);
    reset({ name: track.name });
  }

  const groupedItems = useMemo(() => {
    const groups: { [key: string]: AgendaItem[] } = {};
    agendaItems.forEach(item => {
        const trackKey = item.trackName || 'Unassigned';
        if (!groups[trackKey]) {
            groups[trackKey] = [];
        }
        groups[trackKey].push(item);
    });

    Object.values(groups).forEach(group => {
        group.sort((a, b) => a.startTime.localeCompare(b.startTime));
    });

    return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
  }, [agendaItems]);


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Agenda Sessions</h2>
            <Button onClick={handleAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Item</Button>
        </div>
        
        {groupedItems.length > 0 ? (
            groupedItems.map(([trackName, items]) => (
                <Card key={trackName}>
                    <CardHeader>
                        <CardTitle>{trackName}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Time</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Speaker</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <Badge variant="outline" className="flex items-center gap-1.5 whitespace-nowrap">
                                                    <Clock className="h-3 w-3"/>{item.startTime} - {item.endTime}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                              <div className="font-medium">{item.title}</div>
                                              {item.category && <Badge variant="secondary" className="mt-1">{item.category}</Badge>}
                                            </TableCell>
                                            <TableCell>{item.speaker || 'N/A'}</TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => handleEdit(item)}><Pencil className="mr-2 h-4 w-4" />Edit</DropdownMenuItem>
                                                            <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" />Delete</DropdownMenuItem></AlertDialogTrigger>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                            <AlertDialogDescription>This will permanently delete the agenda item "{item.title}".</AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(item.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            ))
        ) : (
            <div className="text-center py-16 border rounded-lg">
                <p className="text-muted-foreground text-lg">No agenda items have been created yet.</p>
            </div>
        )}
      </div>

      <Card>
        <CardHeader>
            <CardTitle>{editingTrack ? 'Edit Track' : 'Manage Tracks'}</CardTitle>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleSubmit(onManageTrack)} className="flex items-start gap-2 mb-4">
                <div className="flex-grow">
                    <Input placeholder="Track name..." {...register('name')} />
                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name.message}</p>}
                </div>
                <Button type="submit">{editingTrack ? 'Save' : 'Add'}</Button>
                {editingTrack && <Button type="button" variant="ghost" onClick={() => { setEditingTrack(null); reset({name: ''});}}>Cancel</Button>}
            </form>
            <div className="space-y-2">
                {tracks.map(track => (
                    <div key={track.id} className="flex items-center justify-between p-2 rounded-md bg-secondary">
                        <span className="text-sm font-medium">{track.name}</span>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => handleEditTrack(track)}>
                                <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Delete "{track.name}"?</AlertDialogTitle>
                                        <AlertDialogDescription>This action cannot be undone. You can only delete tracks that are not being used by any agenda session.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => onDeleteTrack(track.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </div>
                ))}
                 {tracks.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No tracks created.</p>
                )}
            </div>
        </CardContent>
      </Card>

      {isFormOpen && (
        <AgendaForm
          isOpen={isFormOpen}
          setIsOpen={setIsFormOpen}
          item={selectedItem}
          tracks={tracks}
          token={token}
          onSave={handleRefresh}
        />
      )}
    </div>
  );
}
