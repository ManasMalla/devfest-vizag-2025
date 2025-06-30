import Image from "next/image"

const images = [
  { src: "/images/gallery/IMG_00000.jpg", alt: "Gallery image 0" },
  { src: "/images/gallery/IMG_00001.jpg", alt: "Gallery image 1" },
  { src: "/images/gallery/IMG_00002.jpg", alt: "Gallery image 2" },
  { src: "/images/gallery/IMG_00004.jpg", alt: "Gallery image 4" },
  { src: "/images/gallery/IMG_00005.jpg", alt: "Gallery image 5" },
  { src: "/images/gallery/IMG_00006.jpg", alt: "Gallery image 6" },
  { src: "/images/gallery/IMG_00007.jpg", alt: "Gallery image 7" },
  { src: "/images/gallery/IMG_00008.jpg", alt: "Gallery image 8" },
  { src: "/images/gallery/IMG_00009.jpg", alt: "Gallery image 9" },
  { src: "/images/gallery/IMG_00010.jpg", alt: "Gallery image 10" },
  { src: "/images/gallery/IMG_00011.jpg", alt: "Gallery image 11" },
  { src: "/images/gallery/IMG_00012.jpg", alt: "Gallery image 12" },
  { src: "/images/gallery/IMG_00013.jpg", alt: "Gallery image 13" },
  { src: "/images/gallery/IMG_00014.jpg", alt: "Gallery image 14" },
  { src: "/images/gallery/IMG_00015.jpg", alt: "Gallery image 15" },
  { src: "/images/gallery/IMG_00016.jpg", alt: "Gallery image 16" },
  { src: "/images/gallery/IMG_00018.jpg", alt: "Gallery image 18" },
  { src: "/images/gallery/IMG_00019.jpg", alt: "Gallery image 19" },
]

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
            />
          </div>
        ))}
      </div>
    </div>
  )
}
