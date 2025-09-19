import Image from "next/image";
import Link from "next/link";

const sponsors = [
  {
    name: "Google for Developers",
    logoUrl: "/images/past-sponsors/googlefordevelopers.png",
    websiteUrl: "https://developers.google.com/",
    aiHint: "Google For Developers Logo"
  },
  {
    name: "GITAM University",
    logoUrl: "/images/past-sponsors/gitam.png",
    websiteUrl: "https://www.gitam.edu/",
    aiHint: "GITAM University logo"
  },
];

export function Sponsors() {
  return (
    <section className="w-full py-12">
      <div className="container mx-auto px-4 md:px-6">
        <h2 className="text-3xl font-bold text-center mb-12">
          Our Sponsors
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {sponsors.map((sponsor) => (
            <Link
              key={sponsor.name}
              href={sponsor.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-lg border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary bg-white"
              aria-label={`Visit ${sponsor.name}'s website`}
            >
              <Image
                src={sponsor.logoUrl}
                alt={`${sponsor.name} logo`}
                width={150}
                height={60}
                data-ai-hint={sponsor.aiHint}
                className="object-contain transition-transform duration-300 group-hover:scale-110"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
