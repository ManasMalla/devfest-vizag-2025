import { SubscriptionForm } from "@/components/subscription-form";
import { Button } from "@/components/ui/button";
import { Instagram, Users } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-grow flex-col items-center justify-center p-4 text-center animate-fade-in-up">
        <div className="animate-pulse bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-5xl md:text-7xl font-extrabold text-transparent py-2">
          Coming Soon
        </div>
        <p className="mt-6 mb-8 text-base md:text-lg text-muted-foreground max-w-lg">
          DevFest Vizag 2025 is on its way. Enter your email to be notified when tickets go on sale!
        </p>
        
        <SubscriptionForm />

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button asChild variant="outline">
            <Link href="https://instagram.com/gdg_vizag" target="_blank" rel="noopener noreferrer">
              <Instagram className="mr-2" />
              Follow on Instagram
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="https://gdg.community.dev/gdg-vizag" target="_blank" rel="noopener noreferrer">
              <Users className="mr-2" />
              Join Community
            </Link>
          </Button>
        </div>
    </div>
  );
}
