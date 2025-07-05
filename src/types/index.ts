import type { Timestamp } from "firebase-admin/firestore";

export interface Job {
  id: string;
  title: string;
  description: string;
  category: 'Lead' | 'Volunteer';
  additionalQuestions?: string[];
}

export interface JobApplication {
    id?: string;
    jobId: string;
    jobTitle: string;
    userId: string;
    userEmail: string;
    fullName: string;
    phone: string;
    whatsapp: string;
    answers: Record<string, string>;
    submittedAt: Timestamp;
}
