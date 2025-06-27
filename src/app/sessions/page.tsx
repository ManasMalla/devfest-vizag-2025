import { GoogleFormEmbed } from "@/components/google-form-embed"

export default function SessionIdeasPage() {
  const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLScw-n2i0N-GBCp2k2a2iCVo4kBbX-9P4g-Oq-u-K2k_y-Z-3A/viewform?embedded=true";

  return (
    <div className="container mx-auto py-12 px-4 animate-fade-in-up">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          Suggest a Session Idea
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Have a great idea for a talk or workshop? Share it with us!
        </p>
      </div>
      <GoogleFormEmbed formUrl={formUrl} title="Suggest a Session Idea" />
    </div>
  )
}
