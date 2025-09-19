
import Image from "next/image";
import Link from "next/link";

const images = [
  { src: "/images/gallery/IMG_00000.jpg", alt: "DevFest Vizag 2024 audience", "data-ai-hint": "conference audience" },
  { src: "/images/gallery/IMG_00012.jpg", alt: "Speaker on stage at DevFest Vizag 2024", "data-ai-hint": "speaker stage" },
  { src: "/images/gallery/IMG_00014.jpg", alt: "Attendees networking at DevFest Vizag 2024", "data-ai-hint": "networking people" },
  { src: "/images/gallery/IMG_00013.jpg", alt: "Workshop session at DevFest Vizag 2024", "data-ai-hint": "workshop collaboration" },
];

export function AgendaPromoSection() {
  return (
    <section className="w-full max-w-4xl mx-auto py-12 px-4">
       <div className="text-center mb-8">
        <p className="text-lg text-muted-foreground">
          Be a part of the agentic and cloud revolution. Explore the{' '}
          <Link href="/agenda" className="text-primary hover:underline">agenda</Link> 
          {' '}to know more.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
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
    </section>
  );
}
