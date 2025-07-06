'use client';

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import type { Job, ClientJobApplication } from '@/types';
import { getUserApplications } from '@/app/volunteer/actions';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from './ui/skeleton';
import { ApplicationDialog } from './application-dialog';
import { Badge } from './ui/badge';
import { Loader2 } from 'lucide-react';

interface JobBoardProps {
  jobs: Job[];
}

export default function JobBoard({ jobs }: JobBoardProps) {
  const [user, loading] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState('Leads');
  const [userApplications, setUserApplications] = useState<ClientJobApplication[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const fetchUserApps = async () => {
      if (user) {
        setIsLoadingApps(true);
        const token = await user.getIdToken();
        const apps = await getUserApplications(token);
        setUserApplications(apps);
        setIsLoadingApps(false);
      } else {
        // If user logs out, clear their applications
        setUserApplications([]);
        setIsLoadingApps(false);
      }
    };
    if (!loading) {
      fetchUserApps();
    }
  }, [user, loading, refreshKey]);

  // Filter for open jobs only - old jobs without the field are treated as 'open'.
  const openJobs = jobs.filter(job => (job.status ?? 'open') === 'open');

  const leads = openJobs.filter((job) => job.category === 'Lead');
  const volunteers = openJobs.filter((job) => job.category === 'Volunteer');
  
  const appliedJobIds = new Set(userApplications.map(app => app.jobId));
  
  const handleApplicationSubmitted = () => {
    setRefreshKey(key => key + 1);
  };

  const getBadgeVariant = (status: ClientJobApplication['status']) => {
    switch (status) {
      case 'Accepted': return 'default';
      case 'Shortlisted': return 'secondary';
      case 'Rejected': return 'destructive';
      case 'Applied': return 'outline';
      default: return 'outline';
    }
  };

  const renderJobList = (jobList: Job[]) => {
    if (jobList.length === 0) {
      return <p className="text-muted-foreground mt-4 text-center">No open positions in this category at the moment.</p>;
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-6">
        {jobList.map((job) => (
          <Card key={job.id} className="flex flex-col">
            <CardHeader>
              <CardTitle>{job.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{job.description}</CardDescription>
            </CardContent>
            <CardFooter>
              {loading ? (
                <Skeleton className="h-10 w-24" />
              ) : user ? (
                 appliedJobIds.has(job.id) ? (
                   <Button disabled variant="outline">Applied</Button>
                 ) : (
                   <ApplicationDialog job={job} user={user} onApplicationSubmitted={handleApplicationSubmitted}>
                      <Button>Apply Now</Button>
                   </ApplicationDialog>
                 )
              ) : (
                <Button disabled>Sign in to Apply</Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };
  
  return (
    <>
      {user && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold tracking-tight text-center mb-6">Your Applications</h2>
          {isLoadingApps ? (
            <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : userApplications.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userApplications.map(app => (
                <Card key={app.id}>
                   <CardHeader>
                    <CardTitle className="text-xl">{app.jobTitle}</CardTitle>
                  </CardHeader>
                  <CardFooter>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Status:</span>
                      <Badge variant={getBadgeVariant(app.status)}>{app.status}</Badge>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center">You haven't applied for any positions yet.</p>
          )}
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 mx-auto">
          <TabsTrigger value="Leads">Leads</TabsTrigger>
          <TabsTrigger value="Volunteers">Volunteers</TabsTrigger>
        </TabsList>
        <TabsContent value="Leads">
          {renderJobList(leads)}
        </TabsContent>
        <TabsContent value="Volunteers">
          {renderJobList(volunteers)}
        </TabsContent>
      </Tabs>
    </>
  );
}
