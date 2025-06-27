"use client";

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'

import { cn } from "@/lib/utils"
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { ThemeToggle } from './theme-toggle'
import { AuthButton } from './auth-button'
import config from '@/config.json';
import { DevFestLogo } from './logo';

const allNavLinks = [
  { key: 'home', href: '/', label: 'Home' },
  { key: 'volunteer', href: '/volunteer', label: 'Volunteer' },
  { key: 'sessions', href: '/sessions', label: 'Session Ideas' },
  { key: 'speakers', href: '/speakers', label: 'Speakers' },
  { key: 'sponsors', href: '/sponsors', label: 'Sponsors' },
] as const;

const navLinks = allNavLinks.filter(link => config.navigation[link.key]);

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="flex items-center justify-start flex-1">
          {/* Mobile menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="pr-0">
                <Link href="/" className="flex items-center space-x-2 mb-6">
                  <DevFestLogo className="h-6 w-6" />
                  <span className="font-bold">DevFest Vizag 2025</span>
                </Link>
                <div className="flex flex-col space-y-3">
                  {navLinks.map(({ href, label }) => {
                    const isActive = pathname === href;
                    return (
                      <SheetClose key={href} asChild>
                        <Link
                          href={href}
                          className={cn(
                            "transition-colors hover:text-foreground/80 p-2 rounded-l-md",
                            isActive ? "text-foreground bg-secondary" : "text-foreground/60"
                          )}
                        >
                          {label}
                        </Link>
                      </SheetClose>
                    )
                  })}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <Link href="/" className="mr-6 flex items-center space-x-2">
            <DevFestLogo className="h-6 w-6" />
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {navLinks.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "transition-colors hover:text-foreground/80",
                    isActive ? "text-foreground" : "text-foreground/60"
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>
        
        <div className="flex items-center justify-end">
          <AuthButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
