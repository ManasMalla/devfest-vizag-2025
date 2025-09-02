'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import type { User } from 'firebase/auth';
import type { Job } from '@/types';
import { submitApplication } from '@/app/volunteer/actions';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface ApplicationDialogProps {
  job: Job;
  user: User | null | undefined;
  children: React.ReactNode;
  onApplicationSubmitted?: () => void;
}

const ApplicationSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phone: z.string().min(10, "A valid phone number is required"),
  whatsapp: z.string().min(10, "A valid WhatsApp number is required"),
});

export function ApplicationDialog({ job, user, children, onApplicationSubmitted }: ApplicationDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof ApplicationSchema>>({
    resolver: zodResolver(ApplicationSchema),
    defaultValues: {
      fullName: user?.displayName || '',
      phone: '',
      whatsapp: '',
    },
  });

  async function onSubmit(values: z.infer<typeof ApplicationSchema>) {
    setIsSubmitting(true);

    if (!user) {
        toast({ variant: 'destructive', title: 'Not Signed In', description: 'You must be signed in to apply.' });
        setIsSubmitting(false);
        return;
    }
    const token = await user.getIdToken();
    
    const formData = new FormData();
    formData.append('fullName', values.fullName);
    formData.append('phone', values.phone);
    formData.append('whatsapp', values.whatsapp);
    formData.append('jobId', job.id);
    formData.append('jobTitle', job.title);

    // Append additional question answers
    job.additionalQuestions?.forEach(question => {
        const answer = (document.getElementById(`answer-${question}`) as HTMLTextAreaElement)?.value || '';
        formData.append(`answer-${question}`, answer);
    });

    const result = await submitApplication(formData, token);

    if (result.success) {
      toast({
        title: 'Application Submitted!',
        description: "We've received your application and will be in touch soon.",
      });
      onApplicationSubmitted?.();
      setIsOpen(false);
      form.reset();
    } else {
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: result.error,
      });
    }
    setIsSubmitting(false);
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Apply for: {job.title}</DialogTitle>
          <DialogDescription>
            Review the job details and fill out the form below to apply.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-hidden">
          <ScrollArea className="h-full pr-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Job Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.description}</p>
              </div>
              <Separator />
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+91 12345 67890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="whatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Number</FormLabel>
                        <FormControl>
                          <Input type="tel" placeholder="+91 12345 67890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <Input value={user?.email || ''} disabled />
                  </FormItem>

                  {job.additionalQuestions && job.additionalQuestions.length > 0 && (
                      <div className="space-y-4 pt-4 border-t">
                          {job.additionalQuestions.map((question, index) => (
                              <FormItem key={index}>
                                  <FormLabel>{question}</FormLabel>
                                  <FormControl>
                                      <Textarea id={`answer-${question}`} placeholder="Your answer..." />
                                  </FormControl>
                              </FormItem>
                          ))}
                      </div>
                  )}

                  <DialogFooter className="sticky bottom-0 bg-background pt-4">
                    <DialogClose asChild>
                      <Button type="button" variant="secondary" disabled={isSubmitting}>
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit Application
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
