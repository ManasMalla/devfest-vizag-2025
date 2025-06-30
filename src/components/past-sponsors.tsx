import Image from "next/image";
import Link from "next/link";

const sponsors = [
  {
    name: "Google",
    logoUrl: "https://placehold.co/150x75.png",
    websiteUrl: "https://google.com",
    aiHint: "google logo"
  },
  {
    name: "Firebase",
    logoUrl: "https://placehold.co/150x75.png",
    websiteUrl: "https://firebase.google.com",
    aiHint: "firebase logo"
  },
  {
    name: "GitHub",
    logoUrl: "https://placehold.co/150x75.png",
    websiteUrl: "https://github.com",
    aiHint: "github logo"
  },
  {
    name: "Vercel",
    logoUrl: "https://placehold.co/150x75.png",
    websiteUrl: "https://vercel.com",
    aiHint: "vercel logo"
  },
    {
    name: "JetBrains",
    logoUrl: "https://placehold.co/150x75.png",
    websiteUrl: "https://www.jetbrains.com/",
    aiHint: "jetbrains logo"
  },
  {
    name: "DigitalOcean",
    logoUrl: "https://placehold.co/150x75.png",
    websiteUrl: "https://www.digitalocean.com/",
    aiHint: "digitalocean logo"
  }
];

export function PastSponsors() {
  return (
    <section className="w-full py-12">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-3xl font-bold text-center mb-12">
          Our Valued Past Sponsors
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {sponsors.map((sponsor) => (
            <Link
              key={sponsor.name}
              href={sponsor.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-lg border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary"
              aria-label={`Visit ${sponsor.name}'s website`}
            >
              <Image
                src={sponsor.logoUrl}
                alt={`${sponsor.name} logo`}
                width={150}
                height={60}
                data-ai-hint={sponsor.aiHint}
                className="object-contain transition-transform duration-300 filter grayscale group-hover:filter-none group-hover:scale-110"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
