import { getDashboardData } from './actions';
import { auth } from '@/lib/firebase';
import { redirect } from 'next/navigation';
import VolunteerDashboard from '@/components/volunteer-dashboard';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function VolunteerDashboardPage() {
    // This is a server component, so we get the current user's token differently.
    // For this example, we assume a mechanism to get the token on the server exists.
    // In a real app, this might come from headers or a server-side auth library.
    // Here, we'll simulate it for structure, but the client will provide the real token.
    // The initial check is just to gate access.
    
    // A proper implementation would involve server-side session management.
    // For this app, we'll fetch the user on the client and pass the token from there.
    // This server component's main job is to render the container and handle initial states.

    return (
        <div className="container mx-auto py-12 px-4 animate-fade-in-up">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
                    Volunteer Dashboard
                </h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                    Manage teams and coordinate with fellow volunteers.
                </p>
            </div>
            
            <VolunteerDashboard />
        </div>
    );
}
