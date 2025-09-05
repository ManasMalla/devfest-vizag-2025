import { EmailAuthForm } from '@/components/email-auth-form';
import { SocialSignIn } from '@/components/social-sign-in';
import { Separator } from '@/components/ui/separator';

export default function LoginPage() {
  return (
    <div className="container mx-auto py-12 px-4 flex justify-center animate-fade-in-up">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
                Welcome
            </h1>
            <p className="mt-2 text-muted-foreground">
                Sign in or create an account to continue
            </p>
        </div>
        
        <EmailAuthForm />
        
        <div className="relative my-6">
          <Separator />
          <span className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 bg-background px-2 text-sm text-muted-foreground">
            OR
          </span>
        </div>

        <SocialSignIn />
      </div>
    </div>
  );
}
