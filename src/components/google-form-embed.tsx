"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowUpRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

type GoogleFormEmbedProps = {
  formUrl: string;
  title: string;
}

export function GoogleFormEmbed({ formUrl, title }: GoogleFormEmbedProps) {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  if (isMobile === null) {
    return <Skeleton className="w-full h-[400px] md:h-[800px] mt-8" />;
  }

  if (isMobile) {
    return (
      <div className="mt-8 flex flex-col items-center gap-4 text-center p-6 rounded-lg border bg-card">
        <p className="text-muted-foreground">This form is best viewed on a larger screen.</p>
        <Button asChild size="lg">
          <a href={formUrl} target="_blank" rel="noopener noreferrer">
            Open Form in New Tab <ArrowUpRight className="ml-2 h-4 w-4" />
          </a>
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-8">
      <iframe
        src={formUrl}
        width="100%"
        height="1000"
        frameBorder="0"
        marginHeight={0}
        marginWidth={0}
        title={title}
        className="rounded-lg border bg-card"
      >
        Loading…
      </iframe>
    </div>
  )
}
