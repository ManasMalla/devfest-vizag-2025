'use client';

import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import type { Job } from '@/types';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from './ui/skeleton';
import { ApplicationDialog } from './application-dialog';

interface JobBoardProps {
  jobs: Job[];
}

export default function JobBoard({ jobs }: JobBoardProps) {
  const [user, loading] = useAuthState(auth);
  const [activeTab, setActiveTab] = useState('Leads');

  const leads = jobs.filter((job) => job.category === 'Lead');
  const volunteers = jobs.filter((job) => job.category === 'Volunteer');

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
                 <ApplicationDialog job={job} user={user}>
                    <Button>Apply Now</Button>
                 </ApplicationDialog>
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
  );
}
