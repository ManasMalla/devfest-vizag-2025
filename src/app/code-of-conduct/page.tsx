import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { FileText } from "lucide-react"

export default function CodeOfConductPage() {
  // A sample PDF URL. Replace with your actual Code of Conduct PDF.
  const pdfUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";

  return (
    <div className="container mx-auto py-12 px-4 animate-fade-in-up">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
          Code of Conduct
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          We are committed to providing a safe, respectful, and welcoming environment for everyone.
        </p>
      </div>

      <Alert className="max-w-4xl mx-auto mb-8">
        <FileText className="h-4 w-4" />
        <AlertTitle>Our Pledge</AlertTitle>
        <AlertDescription>
          Please take a moment to read our Code of Conduct to understand the standards we uphold at our events. All attendees, speakers, sponsors, and volunteers are required to agree with the code of conduct.
        </AlertDescription>
      </Alert>

      <div className="mt-8">
        <iframe
          src={pdfUrl}
          width="100%"
          height="1000"
          frameBorder="0"
          title="Code of Conduct PDF"
          className="rounded-lg border bg-card"
        >
          Loading PDF... If it does not appear, your browser may not support embedded PDFs. 
          You can <a href={pdfUrl} target="_blank" rel="noopener noreferrer">download it here</a>.
        </iframe>
      </div>
    </div>
  )
}
