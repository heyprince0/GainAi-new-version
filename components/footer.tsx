import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-12 lg:px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <span className="text-xs font-bold text-primary-foreground">G</span>
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground">
              Gain<span className="text-primary">Ai</span>
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/food-scanner"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Food Scanner
            </Link>
            <Link
              href="/body-scanner"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Body Scanner
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            {"2026 GainAi. All rights reserved."}
          </p>
        </div>
      </div>
    </footer>
  )
}
