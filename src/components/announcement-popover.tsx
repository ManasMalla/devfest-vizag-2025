'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { getAnnouncements } from '@/app/announcements/actions';
import type { Announcement } from '@/types';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Loader2 } from 'lucide-react';
import { MarkdownPreview } from './markdown-preview';
import { Separator } from './ui/separator';

const LAST_VIEWED_KEY = 'devfest_announcements_last_viewed';

export function AnnouncementPopover() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    const fetchAndCheckAnnouncements = async () => {
      setIsLoading(true);
      try {
        const fetchedAnnouncements = await getAnnouncements();
        setAnnouncements(fetchedAnnouncements);

        if (fetchedAnnouncements.length > 0) {
          const lastViewedTimestamp = localStorage.getItem(LAST_VIEWED_KEY);
          const latestTimestamp = new Date(fetchedAnnouncements[0].createdAt).getTime();

          if (!lastViewedTimestamp || latestTimestamp > parseInt(lastViewedTimestamp, 10)) {
            setHasNew(true);
          }
        }
      } catch (error) {
        console.error("Failed to fetch announcements:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAndCheckAnnouncements();
  }, []);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open && hasNew) {
      if (announcements.length > 0) {
        localStorage.setItem(LAST_VIEWED_KEY, new Date(announcements[0].createdAt).getTime().toString());
      }
      setHasNew(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasNew && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          )}
          <span className="sr-only">Toggle Announcements</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4">
          <h4 className="font-medium leading-none">Announcements</h4>
        </div>
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : announcements.length > 0 ? (
            <div className="p-4 pt-0">
              {announcements.map((ann, index) => (
                <div key={ann.id}>
                  <div className="text-sm py-3">
                    <div className="text-muted-foreground text-xs mb-1">
                      {formatDistanceToNow(new Date(ann.createdAt), { addSuffix: true })}
                    </div>
                    <MarkdownPreview content={ann.content} />
                  </div>
                  {index < announcements.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">No announcements yet.</p>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
