'use client';

import { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { requestNotificationPermission } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';

export function NotificationPermissionHandler() {
  const [user] = useAuthState(auth);
  const { toast } = useToast();

  useEffect(() => {
    if (user && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        // Use a toast to ask for permission
        const { id } = toast({
          title: "Enable Notifications",
          description: "Get the latest updates about DevFest Vizag 2025.",
          duration: 10000,
          action: (
            <Button
              onClick={() => {
                requestNotificationPermission();
                // Optionally dismiss the toast after click
              }}
            >
              Enable
            </Button>
          ),
        });
      }
    }
  }, [user, toast]);

  return null; // This component does not render anything
}
