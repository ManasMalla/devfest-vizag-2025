import { getJobs, isAdmin } from "@/app/volunteer/actions";
import AdminDashboard from "@/components/admin-dashboard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

export default async function AdminPage() {
  const adminCheck = await isAdmin();

  if (!adminCheck.isAdmin) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Alert variant="destructive">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You do not have permission to view this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const jobs = await getJobs();

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
      <AdminDashboard initialJobs={jobs} />
    </div>
  );
}
