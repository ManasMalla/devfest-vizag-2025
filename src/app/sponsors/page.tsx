import { GoogleFormEmbed } from "@/components/google-form-embed"
import { Sponsors } from "@/components/sponsors";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Rocket } from "lucide-react"

export default function SponsorsPage() {
  const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLScw-n2i0N-GBCp2k2a2iCVo4kBbX-9P4g-Oq-u-K2k_y-Z-3A/viewform?embedded=true";

  return (
    <div className="container mx-auto py-12 px-4 animate-fade-in-up">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          Sponsor DevFest Vizag 2025
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Partner with us to make this year's DevFest an unforgettable experience for the tech community in Vizag.
        </p>
      </div>

      <Alert className="max-w-4xl mx-auto mb-8">
        <Rocket className="h-4 w-4" />
        <AlertTitle>Become a Valued Partner!</AlertTitle>
        <AlertDescription>
          Your sponsorship helps us create a high-quality, accessible event for everyone. Connect with a passionate audience of developers, designers, and tech enthusiasts.
        </AlertDescription>
      </Alert>

      <Sponsors />
      
      <GoogleFormEmbed formUrl={formUrl} title="Sponsorship Interest Form" />
    </div>
  )
}
