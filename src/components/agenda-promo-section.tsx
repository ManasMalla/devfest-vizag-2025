import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

const images = [
  { src: "https://picsum.photos/seed/devfest1/600/400", alt: "Event photo 1", "data-ai-hint": "conference audience" },
  { src: "https://picsum.photos/seed/devfest2/600/400", alt: "Event photo 2", "data-ai-hint": "speaker stage" },
  { src: "https://picsum.photos/seed/devfest3/600/400", alt: "Event photo 3", "data-ai-hint": "networking people" },
  { src: "https://picsum.photos/seed/devfest4/600/400", alt: "Event photo 4", "data-ai-hint": "workshop collaboration" },
];

export function AgendaPromoSection() {
  return (
    <section className="w-full max-w-4xl mx-auto py-12 px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {images.map((image, index) => (
          <div key={index} className="overflow-hidden rounded-lg shadow-lg group aspect-video">
            <Image
              src={image.src}
              alt={image.alt}
              width={600}
              height={400}
              data-ai-hint={image['data-ai-hint']}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />
          </div>
        ))}
      </div>
      <div className="text-center">
        <p className="text-lg text-muted-foreground mb-4">
          Be a part of the agentic and cloud revolution. Explore the agenda to know more.
        </p>
      </div>
    </section>
  );
}
