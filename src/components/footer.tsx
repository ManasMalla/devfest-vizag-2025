import Link from 'next/link'
import { Mountain, Twitter, Linkedin, Youtube } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center space-x-2">
              <Mountain className="h-6 w-6 text-primary" />
              <span className="font-bold">DevFest Vizag 2025</span>
            </Link>
            <p className="text-muted-foreground max-w-sm">
              The biggest developer conference in Visakhapatnam, brought to you by the community, for the community.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div className="grid gap-2">
              <h3 className="font-semibold">Navigation</h3>
              <Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link>
              <Link href="/speakers" className="text-muted-foreground hover:text-foreground">Speakers</Link>
              <Link href="/sessions" className="text-muted-foreground hover:text-foreground">Sessions</Link>
              <Link href="/sponsors" className="text-muted-foreground hover:text-foreground">Sponsors</Link>
            </div>
            <div className="grid gap-2">
              <h3 className="font-semibold">Community</h3>
              <Link href="/volunteer" className="text-muted-foreground hover:text-foreground">Volunteer</Link>
              <Link href="/code-of-conduct" className="text-muted-foreground hover:text-foreground">Code of Conduct</Link>
            </div>
            <div className="grid gap-2">
              <h3 className="font-semibold">Social</h3>
              <div className="flex gap-4">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                  <Twitter className="h-5 w-5" />
                  <span className="sr-only">Twitter</span>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                  <Linkedin className="h-5 w-5" />
                  <span className="sr-only">LinkedIn</span>
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
                  <Youtube className="h-5 w-5" />
                  <span className="sr-only">YouTube</span>
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} DevFest Vizag. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
