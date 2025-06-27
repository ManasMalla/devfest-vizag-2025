'use client';

import { Button } from "@/components/ui/button";
import { Gallery } from "@/components/gallery";
import { Instagram, Users } from "lucide-react";
import Link from "next/link";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from "@/components/ui/skeleton";
import { AuthButton } from "@/components/auth-button";
import config from '@/config.json';

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
      return `Welcome back, ${user.displayName}! We'll keep you updated.`;
    }
    return 'DevFest Vizag 2025 is on its way. Sign in to get notified and stay updated!';
  };

  return (
    <div className="flex flex-grow flex-col items-center animate-fade-in-up w-full">
      <div className="flex flex-col items-center justify-center p-4 text-center pt-16 pb-12">
        <div className="animate-pulse bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-5xl md:text-7xl font-extrabold text-transparent py-2">
          Coming Soon
        </div>
        <div className="mt-6 mb-8 text-base md:text-lg text-muted-foreground max-w-lg min-h-[28px] flex items-center justify-center">
          {renderWelcomeMessage()}
        </div>

        <div className="mt-8 flex flex-col items-center gap-4">
          {!loading && !user && (
            <div className="flex flex-col items-center gap-4 mb-4">
              <AuthButton />
            </div>
          )}
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
    </div>
  );
}
