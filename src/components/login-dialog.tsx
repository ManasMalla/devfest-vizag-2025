
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmailAuthForm } from '@/components/email-auth-form';
import { SocialSignIn } from '@/components/social-sign-in';
import { Separator } from '@/components/ui/separator';
import { useRouter } from 'next/navigation';

interface LoginDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginDialog({ isOpen, onOpenChange }: LoginDialogProps) {
  const router = useRouter();

  const handleSuccessfulLogin = () => {
    onOpenChange(false);
    // You might want to refresh the page or redirect.
    // For now, we just close the dialog. The auth state change should
    // trigger re-renders in components that use it.
    router.refresh(); 
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl">Welcome</DialogTitle>
          <DialogDescription>
            Sign in or create an account to continue
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-4">
          <div className="flex flex-col gap-4">
             <SocialSignIn onLoginSuccess={handleSuccessfulLogin} />
             <div className="relative my-2">
                <Separator />
                <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                    OR
                </span>
            </div>
            <EmailAuthForm onLoginSuccess={handleSuccessfulLogin} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
