import { Card, CardContent } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-grow items-center justify-center p-4 animate-fade-in-up">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
          <div className="animate-pulse bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-5xl md:text-7xl font-extrabold text-transparent">
            Coming Soon
          </div>
          <p className="mt-6 text-base md:text-lg text-muted-foreground">
            DevFest Vizag 2025 is on its way. Stay tuned for exciting updates!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
