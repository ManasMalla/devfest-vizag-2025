import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Presentation, Mic, Rocket } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "700",
    label: "Attendees",
    color: "text-[#4285F4]", // Google Blue
  },
  {
    icon: Presentation,
    value: "2",
    label: "Workshops",
    color: "text-[#DB4437]", // Google Red
  },
  {
    icon: Mic,
    value: "12",
    label: "Speakers",
    color: "text-[#F4B400]", // Google Yellow
  },
  {
    icon: Rocket,
    value: "1",
    label: "Expert Track",
    color: "text-[#0F9D58]", // Google Green
  },
];

export function StatsSection() {
  return (
    <section className="w-full bg-secondary py-12">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <stat.icon className={`h-10 w-10 mx-auto mb-2 ${stat.color}`} />
              <p className="text-3xl md:text-4xl font-bold">{stat.value}</p>
              <p className="text-sm md:text-base text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
