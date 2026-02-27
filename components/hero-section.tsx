"use client"

import Link from "next/link"
import { ArrowRight, ScanLine, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-20 lg:px-6 lg:pt-32 lg:pb-28">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <Activity className="h-3.5 w-3.5" />
            AI-Powered Fitness Intelligence
          </div>

          <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Your body deserves{" "}
            <span className="text-primary">smarter</span> nutrition
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            Scan any food to instantly get macros. Analyze your body composition
            with AI. Get personalized coaching to reach your goals faster.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="rounded-xl px-8 text-base font-semibold shadow-lg shadow-primary/25"
            >
              <Link href="/food-scanner">
                <ScanLine className="mr-2 h-4 w-4" />
                Scan Food
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-xl px-8 text-base font-semibold"
            >
              <Link href="/body-scanner">
                Scan Body
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-20 grid max-w-4xl gap-4 sm:grid-cols-3">
          {[
            {
              title: "Food Scanner",
              description:
                "Snap a photo of any meal and get instant macro breakdowns with AI precision.",
              icon: "scan",
            },
            {
              title: "Body Analysis",
              description:
                "Upload a photo to estimate body fat, composition, and areas to improve.",
              icon: "body",
            },
            {
              title: "AI Coach",
              description:
                "Get personalized nutrition advice and workout tips from your AI fitness coach.",
              icon: "coach",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                {feature.icon === "scan" && <ScanLine className="h-5 w-5" />}
                {feature.icon === "body" && <Activity className="h-5 w-5" />}
                {feature.icon === "coach" && (
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                )}
              </div>
              <h3 className="mb-2 text-base font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
