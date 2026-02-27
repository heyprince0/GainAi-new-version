export function StatsSection() {
  const stats = [
    { value: "50K+", label: "Foods Scanned" },
    { value: "99%", label: "Accuracy Rate" },
    { value: "25K+", label: "Active Users" },
    { value: "4.9", label: "App Rating" },
  ]

  return (
    <section className="border-y border-border/50 bg-muted/30">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-16 lg:grid-cols-4 lg:px-6">
        {stats.map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-3xl font-bold tracking-tight text-primary lg:text-4xl">
              {stat.value}
            </div>
            <div className="mt-1 text-sm font-medium text-muted-foreground">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
