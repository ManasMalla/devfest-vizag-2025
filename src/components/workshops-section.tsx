import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrainCircuit, Cloud } from "lucide-react";

const workshops = [
  {
    icon: BrainCircuit,
    title: "Agentic AI Workshop",
    description: "Dive into the world of autonomous AI agents. Learn how to build, deploy, and manage intelligent agents that can reason, plan, and execute complex tasks. This hands-on workshop is perfect for developers looking to explore the cutting edge of artificial intelligence.",
  },
  {
    icon: Cloud,
    title: "Cloud Workshop",
    description: "Get hands-on experience with the latest cloud technologies. This workshop will cover essential concepts, from serverless architecture to containerization and infrastructure as code, empowering you to build scalable and resilient applications.",
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
          <Card key={workshop.title} className="flex flex-col">
            <CardHeader className="flex-row items-center gap-4">
                <workshop.icon className="h-10 w-10 text-primary flex-shrink-0" />
                <div>
                    <CardTitle>{workshop.title}</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{workshop.description}</CardDescription>
            </CardContent>
            <CardFooter className="flex-col items-start gap-2">
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
