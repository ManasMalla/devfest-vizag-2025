import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

const workshops = [
  {
    image: "/images/gemini.png",
    title: "Agentic AI Workshop",
    description: "Dive into the world of autonomous AI agents. Learn how to build, deploy, and manage intelligent agents that can reason, plan, and execute complex tasks. This hands-on workshop is perfect for developers looking to explore the cutting edge of artificial intelligence.",
    aiHint: "Gemini AI logo"
  },
  {
    image: "/images/google-cloud.png",
    title: "Cloud Workshop",
    description: "This workshop will cover the basics of the Google Cloud Platform. Get hands-on experience with core concepts and services, perfect for beginners looking to start their cloud journey.",
    aiHint: "Google Cloud logo"
  }
];

export function WorkshopsSection() {
  return (
    <section id="workshops" className="w-full max-w-4xl mx-auto py-12 px-4 scroll-mt-20">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold tracking-tight lg:text-4xl">
          Hands-On Workshops
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Level up your skills with our deep-dive workshops.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {workshops.map((workshop) => (
          <Card key={workshop.title} className="flex flex-col text-center">
            <CardHeader className="items-center">
                <div className="bg-white rounded-full p-2 mb-4">
                    <Image
                        src={workshop.image}
                        alt={`${workshop.title} logo`}
                        width={64}
                        height={64}
                        data-ai-hint={workshop.aiHint}
                        className="object-contain"
                    />
                </div>
                <CardTitle>{workshop.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{workshop.description}</CardDescription>
            </CardContent>
            <CardFooter className="flex-col items-center gap-2">
              <Button variant="outline" disabled>
                View Agenda (Coming Soon)
              </Button>
               <p className="text-xs text-muted-foreground">
                Full agenda will be released on 1st October.
              </p>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
