'use client';

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { useToast } from "@/hooks/use-toast"
import { subscribeToNewsletter } from '@/app/actions';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const initialState = {
  error: null,
  success: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" aria-disabled={pending}>
      {pending ? 'Subscribing...' : 'Subscribe'}
      {!pending && <ArrowRight />}
    </Button>
  );
}

export function SubscriptionForm() {
  const [state, formAction] = useFormState(subscribeToNewsletter, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      toast({
        title: "Success!",
        description: state.success,
      });
      formRef.current?.reset();
    }
    if (state.error) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: state.error,
      });
    }
  }, [state, toast]);

  return (
    <form ref={formRef} action={formAction} className="w-full max-w-sm space-y-4">
      <div className="flex w-full items-center space-x-2">
        <Input
          type="email"
          name="email"
          placeholder="Enter your email"
          required
          className="flex-1"
        />
        <SubmitButton />
      </div>
    </form>
  );
}
