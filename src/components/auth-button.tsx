
'use client';

import Link from 'next/link';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
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
import { LogOut, Shield } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useEffect, useState } from 'react';
import type { UserRole } from '@/types';
import { getUserRole } from '@/app/volunteer/actions';
import { Badge } from '@/components/ui/badge';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-4 w-4">
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12
	c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24
	s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      ></path>
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657
	C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      ></path>
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36
	c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      ></path>
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.089,5.571
	l6.19,5.238C41.38,34.421,44,29.825,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      ></path>
    </svg>
  );
}

export function AuthButton() {
  // If Firebase isn't configured, auth will be null.
  // We can use this to fall back to a safe state.
  const [user, loading, error] = auth ? useAuthState(auth) : [null, true, undefined];
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    const fetchRole = async () => {
      if (user) {
        // Reset role state while fetching
        setRole(null);
        try {
          const token = await user.getIdToken();
          const userRole = await getUserRole(token);
          setRole(userRole);
        } catch (err) {
          console.error("Failed to fetch user role:", err);
          setRole('Attendee'); // Default to attendee on error
        }
      } else {
        // Clear role on logout
        setRole(null);
      }
    };

    if (!loading) {
      fetchRole();
    }
  }, [user, loading]);


  const handleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error signing in with Google', error);
    }
  };

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
    <Button onClick={handleSignIn} variant="outline">
      <GoogleIcon />
      Sign in
    </Button>
  );
}
