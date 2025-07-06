import type { Timestamp } from "firebase-admin/firestore";

export interface Job {
  id: string;
  title: string;
  description: string;
  category: 'Lead' | 'Volunteer';
  additionalQuestions?: string[];
  status?: 'open' | 'closed';
}

export type ApplicationStatus = 'Applied' | 'Shortlisted' | 'Accepted' | 'Rejected';

export interface JobApplication {
    id: string; // The firestore document ID
    jobId: string;
    jobTitle: string;
    userId: string;
    userEmail: string;
    fullName: string;
    phone: string;
    whatsapp: string;
    answers: Record<string, string>;
    submittedAt: Timestamp;
    status: ApplicationStatus;
}


// A version of JobApplication that is safe to pass to client components
export type ClientJobApplication = Omit<JobApplication, 'submittedAt'> & {
  submittedAt: string; // Serialized from Timestamp
};

export interface AdminUser {
  uid: string;
  email: string;
}

export type UserRole = 'Admin' | 'Team Lead' | 'Volunteer' | 'Speaker' | 'Attendee';

export interface Volunteer {
  id: string; // This will be the user's UID
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  teamId?: string | null;
  isLead?: boolean;
}

export interface Team {
  id: string;
  name: string;
}
