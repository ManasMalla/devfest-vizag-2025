import VolunteerDashboard from '@/components/volunteer-dashboard';

export const dynamic = 'force-dynamic';

export default async function VolunteerDashboardPage() {
    // The main VolunteerDashboard component is a client component
    // that will handle its own authentication and data fetching.
    return (
        <div className="container mx-auto py-12 px-4 animate-fade-in-up">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
                    Volunteer Dashboard
                </h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                    Manage teams, tasks, and coordinate with fellow volunteers.
                </p>
            </div>
            
            <VolunteerDashboard />
        </div>
    );
}
