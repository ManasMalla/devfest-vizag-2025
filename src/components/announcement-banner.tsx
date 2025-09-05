
'use client';

import { useState, useEffect } from 'react';
import { getAnnouncements } from '@/app/announcements/actions';
import type { Announcement } from '@/types';
import { Megaphone, X } from 'lucide-react';
import { MarkdownPreview } from './markdown-preview';
import { Skeleton } from './ui/skeleton';

const ANNOUNCEMENT_DISMISS_KEY = 'devfest_announcement_dismissed_';

export function AnnouncementBanner() {
  const [latestAnnouncement, setLatestAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const announcements = await getAnnouncements();
        if (announcements.length > 0) {
          const latest = announcements[0];
          setLatestAnnouncement(latest);
          const dismissedKey = `${ANNOUNCEMENT_DISMISS_KEY}${latest.id}`;
          if (sessionStorage.getItem(dismissedKey) !== 'true') {
            setIsVisible(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch announcements", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const handleDismiss = () => {
    if (latestAnnouncement) {
      const dismissedKey = `${ANNOUNCEMENT_DISMISS_KEY}${latestAnnouncement.id}`;
      sessionStorage.setItem(dismissedKey, 'true');
      setIsVisible(false);
    }
  };
  
  if (isLoading) {
    return <Skeleton className="h-12 w-full" />;
  }

  if (!isVisible || !latestAnnouncement) {
    return null;
  }

  return (
    <div className="w-full bg-primary/10 text-primary-foreground">
      <div className="container mx-auto grid grid-cols-[auto,1fr,auto] items-center gap-4 px-4 py-3 text-sm">
        <Megaphone className="h-5 w-5 flex-shrink-0 text-primary" />
        <div className="text-center text-foreground">
            <MarkdownPreview content={latestAnnouncement.content} />
        </div>
        <button
          onClick={handleDismiss}
          className="rounded-md p-1 text-foreground/70 hover:bg-primary/20 hover:text-foreground"
          aria-label="Dismiss announcement"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
