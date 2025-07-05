'use client';

import { useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { getJobs, isAdmin } from "@/app/volunteer/actions";
import AdminDashboard from "@/components/admin-dashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Terminal } from "lucide-react";
import type { Job } from '@/types';

export default function AdminPage() {
  const [user, loading] = useAuthState(auth);
  const [status, setStatus] = useState({
    isLoading: true,
    isAuthorized: false,
    token: ''
  });
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (user) {
        try {
          const idToken = await user.getIdToken();
          const adminCheck = await isAdmin(idToken);
          if (adminCheck.isAdmin) {
            const initialJobs = await getJobs();
            setJobs(initialJobs);
            setStatus({ isLoading: false, isAuthorized: true, token: idToken });
          } else {
            setStatus({ isLoading: false, isAuthorized: false, token: '' });
          }
        } catch (error) {
           console.error("Error during admin check:", error);
           setStatus({ isLoading: false, isAuthorized: false, token: '' });
        }
      } else {
        setStatus({ isLoading: false, isAuthorized: false, token: '' });
      }
    };
    if (!loading) {
      checkAdmin();
    }
  }, [user, loading]);

  if (status.isLoading) {
    return (
      <div className="container mx-auto py-12 px-4 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!status.isAuthorized) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to view this page. Please sign in with an admin account.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          Admin Dashboard
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Manage volunteer and lead job postings.
        </p>
      </div>
      <AdminDashboard initialJobs={jobs} token={status.token} />
    </div>
  );
}
