'use client';

import { Button } from "@/components/ui/button";
import { Gallery } from "@/components/gallery";
import { Instagram, Users, Calendar, MapPin } from "lucide-react";
import Link from "next/link";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from "@/components/ui/skeleton";
import config from '@/config.json';
import { PastSponsors } from "@/components/past-sponsors";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { DevFestLogo } from "@/components/logo";

export default function Home() {
  const [user, loading] = auth ? useAuthState(auth) : [null, true];

  const renderWelcomeMessage = () => {
    if (!auth) {
      return "Firebase is not configured. Please check your setup.";
    }
    if (loading) {
      return <Skeleton className="h-7 w-96 max-w-full" />;
    }
    if (user) {
      return `Welcome back, ${user.displayName}! We'll keep you updated on ticket availability.`;
    }
    return 'DevFest Vizag 2025 is on its way. Sign in to get notified and stay updated!';
  };

  return (
    <div className="flex flex-grow flex-col items-center animate-fade-in-up w-full">
      <AnnouncementBanner />
      <div className="z-10 flex flex-col items-center justify-center p-4 text-center pt-16 pb-12">
        
        <DevFestLogo className="h-12 md:h-16 w-auto mb-6" />

        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Join us for the largest developer conference in Visakhapatnam, featuring expert speakers, hands-on workshops, and networking opportunities with the best in tech.
        </p>
        
        <div className="mt-8 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-muted-foreground">
            <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Date: TBD</span>
            </div>
            <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Venue: TBD</span>
            </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          <Button size="lg" disabled>
            Tickets Opening Soon
          </Button>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild variant="outline">
              <Link href={config.socials.instagram} target="_blank" rel="noopener noreferrer">
                <Instagram />
                Follow on Instagram
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={config.socials.community} target="_blank" rel="noopener noreferrer">
                <Users />
                Join Community
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      <Gallery />
      <PastSponsors />
    </div>
  );
}
