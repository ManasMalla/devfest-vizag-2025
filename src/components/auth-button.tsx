
'use client';

import Link from 'next/link';
import { signOut } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, Shield, LogIn } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useEffect, useState } from 'react';
import type { UserRole } from '@/types';
import { getUserRole } from '@/app/volunteer/actions';
import { Badge } from '@/components/ui/badge';
import { LoginDialog } from './login-dialog';

export function AuthButton() {
  const [user, loading, error] = auth ? useAuthState(auth) : [null, true, undefined];
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoginDialogOpen, setIsLoginDialogOpen] = useState(false);

  useEffect(() => {
    const fetchRole = async () => {
      if (user) {
        setRole(null);
        try {
          const token = await user.getIdToken();
          const userRole = await getUserRole(token);
          setRole(userRole);
        } catch (err) {
          console.error("Failed to fetch user role:", err);
          setRole('Attendee');
        }
      } else {
        setRole(null);
      }
    };

    if (!loading) {
      fetchRole();
    }
  }, [user, loading]);

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  if (!auth) {
    return (
      <Button variant="outline" disabled title="Firebase is not configured">
        Auth Unavailable
      </Button>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-20 rounded-md" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    );
  }

  if (error) {
    console.error('Authentication Error:', error);
    return <p className='text-xs text-destructive'>Auth Error</p>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {role ? (
            <Badge variant="secondary">{role}</Badge>
        ) : (
            <Skeleton className="h-6 w-20 rounded-md" />
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.photoURL || ''} alt={user.displayName || ''} />
                <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {role === 'Admin' && (
              <DropdownMenuItem asChild>
                <Link href="/admin">
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Admin Panel</span>
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <>
      <Button variant="outline" onClick={() => setIsLoginDialogOpen(true)}>
        <LogIn />
        Login
      </Button>
      <LoginDialog isOpen={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen} />
    </>
  );
}
