import { Instagram } from "lucide-react"
import Link from "next/link"

export function FounderSection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        <div className="mx-auto max-w-md">
          <div className="rounded-2xl border border-border/50 bg-card p-8 text-center shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <span className="text-2xl font-bold text-primary">P</span>
            </div>

            <h3 className="mt-5 text-xl font-bold tracking-tight text-foreground">
              Prince
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Founder, GainAi
            </p>

            <Link
              href="https://www.instagram.com/princeeee_00/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <Instagram className="h-4 w-4" />
              @princeeee_00
            </Link>
          </div>

          <p className="mt-6 text-center text-sm leading-relaxed text-muted-foreground">
            Built with a passion for fitness and technology to help you reach
            your goals smarter.
          </p>
        </div>
      </div>
    </section>
  )
}
