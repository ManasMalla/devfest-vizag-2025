import { GoogleFormEmbed } from "@/components/google-form-embed"

export default function SpeakersPage() {
  const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLScw-n2i0N-GBCp2k2a2iCVo4kBbX-9P4g-Oq-u-K2k_y-Z-3A/viewform?embedded=true";

  return (
    <div className="container mx-auto py-12 px-4 animate-fade-in-up">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          Interested in Speaking?
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          We're looking for passionate speakers to share their knowledge. Let us know if you're interested!
        </p>
      </div>
      <GoogleFormEmbed formUrl={formUrl} title="Speaker Interest Form" />
    </div>
  )
}
