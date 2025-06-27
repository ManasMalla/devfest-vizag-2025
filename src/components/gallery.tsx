import Image from "next/image"

const images = [
  { src: "https://placehold.co/600x400.png", alt: "DevFest attendee group photo", hint: "conference tech" },
  { src: "https://placehold.co/600x400.png", alt: "Speaker on stage", hint: "presentation stage" },
  { src: "https://placehold.co/600x400.png", alt: "Networking session", hint: "people networking" },
  { src: "https://placehold.co/600x400.png", alt: "Hands-on workshop", hint: "workshop tech" },
  { src: "https://placehold.co/600x400.png", alt: "Audience listening to a talk", hint: "audience conference" },
  { src: "https://placehold.co/600x400.png", alt: "Sponsor booths", hint: "event sponsor" },
];

export function Gallery() {
  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-4">
      <h2 className="text-3xl font-bold text-center mb-8">Glimpses From Past Events</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {images.map((image, index) => (
          <div key={index} className="overflow-hidden rounded-lg shadow-lg group aspect-video">
            <Image
              src={image.src}
              alt={image.alt}
              width={600}
              height={400}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              data-ai-hint={image.hint}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
