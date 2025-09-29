'use client';

import { Button } from "@/components/ui/button";
import { Instagram, Users, Calendar, MapPin, Ticket, BookOpen, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Skeleton } from "@/components/ui/skeleton";
import config from '@/config.json';
import { Sponsors } from "@/components/sponsors";
import { AnnouncementBanner } from "@/components/announcement-banner";
import { DevFestLogo } from "@/components/logo";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatsSection } from "@/components/stats-section";
import { AgendaPromoSection } from "@/components/agenda-promo-section";
import { WorkshopsSection } from "@/components/workshops-section";

const timelines = [
  { event: "Early Bird Registration", date: "20th September - 30th September" },
  { event: "Skill Pass Applications Close", date: "30th September" },
  { event: "Skill Pass Ticket Rollout", date: "5th October" },
  { event: "General Entry Tickets", date: "1st October - 31st October" },
  { event: "Workshop Agenda Release", date: "1st October" },
  { event: "Final Agenda & Speaker List Release", date: "1st October" },
];


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
      <div className="relative w-full">
        <div className="absolute inset-0">
          <Image
            src="/images/gallery/IMG_00000.jpg"
            alt="DevFest Vizag event"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center p-4 text-center pt-16 pb-12">
          
          <DevFestLogo className="h-12 md:h-16 w-auto mb-6" />

          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Join us for the largest developer conference in Visakhapatnam, featuring expert speakers, hands-on workshops, and networking opportunities with the best in tech.
          </p>
          
          <div className="mt-8 flex flex-wrap justify-center items-center gap-x-6 gap-y-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <p>1st November 2025</p>
              </div>
              <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <Link href="https://share.google/0QmY64oA3sLoM9VMx" target="_blank" rel="noopener noreferrer" className="hover:underline">
                      GITAM University, Visakhapatnam
                  </Link>
              </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg">
                <Link href="#tickets">
                  <Ticket />
                  <p>Get Tickets</p>
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                  <Link href="/agenda">
                      <BookOpen />
                      <p>View Agenda</p>
                  </Link>
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild variant="outline">
                <Link href={config.socials.instagram} target="_blank" rel="noopener noreferrer">
                  <Instagram />
                  <p>Follow on Instagram</p>
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={config.socials.community} target="_blank" rel="noopener noreferrer">
                  <Users />
                  <p>Join Community</p>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <StatsSection />

      <div id="tickets" className="w-full max-w-6xl mx-auto py-12 px-4 scroll-mt-20">
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="text-center">
              <CardTitle className="text-2xl md:text-3xl">Get Your Tickets</CardTitle>
              <Button asChild variant="link" className="px-0 h-auto py-1">
                <Link href="https://konfhub.com/devfest-vizag-2025" target="_blank" rel="noopener noreferrer">
                  Open in new tab <ArrowUpRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <iframe 
              src="https://konfhub.com/widget/devfest-vizag-2025?desc=true&secondaryBg=F7F7F7&ticketBg=F7F7F7&borderCl=F7F7F7&bg=FFFFFF&fontColor=1e1f24&ticketCl=1e1f24&btnColor=002E6E&fontFamily=Nunito&borderRadius=12&widget_type=standard&tickets=56817%2C57853%2C57856%2C57858&ticketId=56817%7C1%3B57853%7C1%3B57856%7C1%3B57858%7C1" 
              id="konfhub-widget" 
              title="Register for DevFest Vizag 2025" 
              width="100%" 
              height="500"
              className="border-none"
            ></iframe>
          </CardContent>
        </Card>
      </div>

      <AgendaPromoSection />
      
      <WorkshopsSection />

      <div id="timelines" className="w-full max-w-4xl mx-auto py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl text-center">Event & Ticket Timelines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Date / Deadline</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {timelines.map((item) => (
                        <TableRow key={item.event}>
                            <TableCell className="font-medium">{item.event}</TableCell>
                            <TableCell>{item.date}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
                *All timelines are tentative and subject to ticket availability.
            </p>
          </CardContent>
        </Card>
      </div>

      <Sponsors />
    </div>
  );
}
