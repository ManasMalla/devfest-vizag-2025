import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

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
    <div className="w-full max-w-5xl mx-auto py-12 px-4">
      <h2 className="text-3xl font-bold text-center mb-8">Glimpses From Past Events</h2>
      <Carousel
        opts={{
          align: "start",
          loop: true,
        }}
        className="w-full"
      >
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <Card>
                  <CardContent className="flex aspect-video items-center justify-center p-0 overflow-hidden rounded-lg">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={600}
                      height={400}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      data-ai-hint={image.hint}
                    />
                  </CardContent>
                </Card>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>
    </div>
  )
}
