import {
  Camera,
  Zap,
  Shield,
  BarChart3,
  Brain,
  Smartphone,
} from "lucide-react"

const features = [
  {
    icon: Camera,
    title: "Instant Food Recognition",
    description:
      "Point your camera at any meal and our AI identifies the food and calculates macros in seconds.",
  },
  {
    icon: Brain,
    title: "Smart Body Analysis",
    description:
      "Advanced AI estimates body fat percentage, muscle distribution, and composition from a single photo.",
  },
  {
    icon: Zap,
    title: "Real-Time Results",
    description:
      "Get instant nutritional breakdowns and body insights with no waiting or manual entry.",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    description:
      "Track your nutrition and body composition over time with beautiful charts and insights.",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description:
      "Your photos and data are processed securely. We never store your images on our servers.",
  },
  {
    icon: Smartphone,
    title: "Mobile Optimized",
    description:
      "Designed mobile-first for on-the-go scanning at the gym, restaurant, or kitchen.",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need for a smarter fitness journey
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            Powered by cutting-edge AI to give you the most accurate insights
            about your nutrition and body.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex gap-4 rounded-2xl border border-border/50 bg-card p-6 transition-all hover:border-primary/20 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <feature.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
