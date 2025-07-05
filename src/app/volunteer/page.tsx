import { getJobs } from "@/app/volunteer/actions";
import JobBoard from "@/components/job-board";
import { auth } from "@/lib/firebase";
import type { User } from "firebase/auth";

export const dynamic = 'force-dynamic';

export default async function VolunteerPage() {
  // This is a server component, but auth state is needed on the client.
  // We can't use react-firebase-hooks/auth here directly.
  // We'll pass the initial jobs to the client component, which will handle auth state.
  const jobs = await getJobs();
  
  // A note on passing user data:
  // For this implementation, we will let the client component `JobBoard`
  // determine the user's auth state using the `useAuthState` hook.
  // This is a common and effective pattern in Next.js.

  return (
    <div className="container mx-auto py-12 px-4 animate-fade-in-up">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          Join the Team
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Help make DevFest Vizag 2025 a massive success! We have openings for various roles.
        </p>
      </div>
      
      <JobBoard jobs={jobs} />
    </div>
  )
}
