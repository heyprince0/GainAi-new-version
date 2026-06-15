'use client'

import { Download, Smartphone, Star, Zap, Shield, CheckCircle, Wifi, MonitorSmartphone, Flame, Dumbbell, HeartPulse, Target, MessageCircle, Camera, Gauge, Clipboard, BarChart3, Grid3x3, LogOut, Moon, Menu, Scan } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { usePwaInstall } from "@/hooks/use-pwa-install"

const steps = [
  {
    step: "1",
    title: "Tap 'Install App'",
    description: 'Click the "Install App" button below. Your browser will show a native install prompt.',
  },
  {
    step: "2",
    title: "Confirm the Install",
    description: 'Tap "Install" or "Add to Home Screen" in the browser prompt that appears.',
  },
  {
    step: "3",
    title: "Find it on Your Screen",
    description: "GainAi will appear on your home screen or app drawer just like a native app.",
  },
  {
    step: "4",
    title: "Launch & Sign In",
    description: "Open GainAi, sign in with your account, and start scanning food and analyzing your body.",
  },
]

const features = [
  { icon: Smartphone, label: "Works on Android & iOS" },
  { icon: Zap, label: "Faster camera & scanning" },
  { icon: Shield, label: "Safe & secure" },
  { icon: Star, label: "All features included" },
  { icon: Wifi, label: "Offline support" },
  { icon: CheckCircle, label: "Free — no hidden charges" },
]

export default function DownloadPage() {
  const { isInstallable, isInstalled, installApp } = usePwaInstall()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-3xl" />
          </div>
          <div className="mx-auto max-w-6xl px-4 py-20 lg:px-6 lg:py-28">
            <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-center lg:gap-20">
              {/* Left content */}
              <div className="flex flex-col items-center text-center lg:items-start lg:text-left flex-1">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
                  <MonitorSmartphone className="h-3.5 w-3.5" />
                  Install on Any Device — Free
                </div>

                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                  Install{" "}
                  <span className="text-primary">GainAi</span>
                </h1>

                <p className="mt-5 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
                  Add GainAi to your home screen for a native app experience — no app store required.
                  Scan food, analyze your body, and chat with your AI coach right from your device.
                </p>

                <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start">
                  {isInstalled ? (
                    <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-6 py-3.5 text-base font-medium text-primary">
                      <Star className="h-5 w-5 fill-primary" />
                      GainAi is already installed!
                    </div>
                  ) : isInstallable ? (
                    <>
                      <Button
                        size="lg"
                        className="rounded-xl px-8 text-base font-semibold shadow-lg shadow-primary/25 gap-2"
                        onClick={installApp}
                      >
                        <Download className="h-5 w-5" />
                        Install App
                      </Button>
                      <div className="flex flex-col items-center justify-center text-center sm:items-start sm:text-left">
                        <p className="text-xs text-muted-foreground">Free · No App Store needed</p>
                        <p className="text-xs text-muted-foreground">Works on Android &amp; iOS</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 lg:items-start">
                      <Button
                        size="lg"
                        className="rounded-xl px-8 text-base font-semibold shadow-lg shadow-primary/25 gap-2"
                        disabled
                      >
                        <Download className="h-5 w-5" />
                        Install App
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Open in Chrome or use your browser menu → "Add to Home Screen"
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Phone mockup with actual dashboard */}
              <div className="flex flex-col items-center gap-4 flex-shrink-0">
                <div className="relative flex flex-col h-[600px] w-[300px] rounded-[2.5rem] border-8 border-foreground bg-white shadow-2xl shadow-black/20 overflow-hidden">
                  {/* Status bar */}
                  <div className="bg-foreground text-white px-4 py-1.5 text-xs font-medium flex justify-between items-center h-6">
                    <span>12:41</span>
                    <span>4G • 100%</span>
                  </div>

                  {/* App content */}
                  <div className="flex-1 overflow-hidden flex flex-col bg-white">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary/15 rounded-lg flex items-center justify-center">
                          <Dumbbell className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex gap-0.5">
                          <span className="font-bold text-sm text-black">Gain</span>
                          <span className="font-bold text-sm text-primary">Ai</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4 text-gray-600" />
                        <LogOut className="h-4 w-4 text-gray-600" />
                        <Menu className="h-4 w-4 text-gray-600" />
                      </div>
                    </div>

                    {/* Scrollable content */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-sm">
                      {/* Welcome */}
                      <div>
                        <h2 className="text-lg font-bold text-black">Welcome back, Prince</h2>
                        <p className="text-xs text-gray-600 mt-0.5">Here&apos;s your fitness overview</p>
                      </div>

                      {/* Streak */}
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🔥</span>
                        <span className="font-semibold text-black">4<span className="font-normal text-gray-600 ml-1">day streak</span></span>
                      </div>

                      {/* Workout card */}
                      <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start gap-2 flex-1">
                            <HeartPulse className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-xs text-black leading-tight">Monday - Lower Strength &amp; Sprint</p>
                            </div>
                          </div>
                          <span className="bg-primary/20 text-primary text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ml-2">Leg Power</span>
                        </div>
                        <p className="text-xs text-gray-600 ml-7 mb-3">5 exercises · 90 mins</p>
                        <button className="w-full bg-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-primary/90 transition-colors">View Workout →</button>
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-2 gap-3">
                        {/* Calories */}
                        <div className="border border-gray-200 rounded-lg p-3 bg-white">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Flame className="h-4 w-4 text-primary" />
                            <span className="text-xs font-semibold text-gray-600">CALORIES</span>
                          </div>
                          <p className="text-xl font-bold text-black">350</p>
                          <p className="text-xs text-gray-500 mt-0.5">of 2,708 goal</p>
                          <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                            <div className="h-full w-1/3 bg-primary rounded-full"></div>
                          </div>
                        </div>

                        {/* Protein */}
                        <div className="border border-gray-200 rounded-lg p-3 bg-white">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Target className="h-4 w-4 text-primary" />
                            <span className="text-xs font-semibold text-gray-600">PROTEIN</span>
                          </div>
                          <p className="text-xl font-bold text-black">16g</p>
                          <p className="text-xs text-gray-500 mt-0.5">of 119g goal</p>
                          <div className="w-full h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                            <div className="h-full w-1/3 bg-primary rounded-full"></div>
                          </div>
                        </div>

                        {/* Diet Accuracy */}
                        <div className="border border-gray-200 rounded-lg p-3 bg-white">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Zap className="h-4 w-4 text-primary" />
                            <span className="text-xs font-semibold text-gray-600">ACCURACY</span>
                          </div>
                          <p className="text-xl font-bold text-black">64%</p>
                          <p className="text-xs text-orange-500 font-medium mt-0.5">Need focus</p>
                          <p className="text-xs text-primary mt-1">↑ +12% Better</p>
                        </div>

                        {/* Body Fat */}
                        <div className="border border-gray-200 rounded-lg p-3 bg-white">
                          <div className="flex items-center gap-1.5 mb-2">
                            <HeartPulse className="h-4 w-4 text-primary" />
                            <span className="text-xs font-semibold text-gray-600">BODY FAT</span>
                          </div>
                          <p className="text-xl font-bold text-black">10%</p>
                          <p className="text-xs text-gray-500 mt-0.5">latest reading</p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom nav */}
                    <div className="border-t border-gray-200 bg-white px-4 py-2 flex items-center justify-between h-16">
                      <div className="flex flex-col items-center gap-1">
                        <Grid3x3 className="h-5 w-5 text-primary" />
                        <span className="text-xs font-medium text-primary">Dashboard</span>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-lg">
                        <Scan className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <HeartPulse className="h-5 w-5 text-gray-400" />
                        <span className="text-xs font-medium text-gray-400">Body</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section className="mx-auto max-w-6xl px-4 py-20 lg:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-foreground mb-4">
            Everything you need to hit your goals
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Powerful features to track nutrition, workouts, and body composition all in one place.
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* AI Food Scanner */}
            <div className="group rounded-2xl border border-border/50 bg-card p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <Camera className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">AI Food Scanner</h3>
              <p className="text-sm text-muted-foreground">Snap a photo of any meal and get instant calorie, macro, and ingredient breakdowns powered by AI.</p>
            </div>

            {/* Fuel Score */}
            <div className="group rounded-2xl border border-border/50 bg-card p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <Gauge className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Fuel Score</h3>
              <p className="text-sm text-muted-foreground">A unique diet quality metric that scores how well your meals align with your fitness goals, not just calories.</p>
            </div>

            {/* AI Workout Planner */}
            <div className="group rounded-2xl border border-border/50 bg-card p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <Clipboard className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">AI Workout Planner</h3>
              <p className="text-sm text-muted-foreground">Personalized workout routines generated and adjusted based on your progress and goals.</p>
            </div>

            {/* Body Composition Tracking */}
            <div className="group rounded-2xl border border-border/50 bg-card p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Body Composition Tracking</h3>
              <p className="text-sm text-muted-foreground">Track body fat %, weight trends, and progress photos over time with visual analytics.</p>
            </div>

            {/* Daily Progress Dashboard */}
            <div className="group rounded-2xl border border-border/50 bg-card p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Daily Progress Dashboard</h3>
              <p className="text-sm text-muted-foreground">See calories, protein, diet accuracy, and streaks at a glance every day.</p>
            </div>

            {/* AI Coach Chat */}
            <div className="group rounded-2xl border border-border/50 bg-card p-6 hover:shadow-lg hover:border-primary/30 transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4 group-hover:bg-primary/20 transition-colors">
                <MessageCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">AI Coach Chat</h3>
              <p className="text-sm text-muted-foreground">Ask questions and get personalized nutrition and fitness guidance from your AI coach anytime.</p>
            </div>
          </div>
        </section>

        {/* Features grid */}
        <section className="border-b border-border/50 bg-muted/20">
          <div className="mx-auto max-w-6xl px-4 py-16 lg:px-6">
            <h2 className="mb-10 text-center text-2xl font-bold tracking-tight text-foreground">
              Why install the app?
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              {features.map((f) => (
                <div
                  key={f.label}
                  className="flex flex-col items-center gap-3 rounded-2xl border border-border/50 bg-card p-5 text-center"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-xs font-medium text-foreground leading-tight">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Install steps */}
        <section className="mx-auto max-w-6xl px-4 py-20 lg:px-6">
          <h2 className="mb-10 text-center text-2xl font-bold tracking-tight text-foreground">
            How to install
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.step} className="flex flex-col gap-4 rounded-2xl border border-border/50 bg-card p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-bold">
                  {s.step}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{s.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{s.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-14 flex flex-col items-center gap-4 text-center">
            <p className="text-lg font-semibold text-foreground">Ready to get started?</p>
            {isInstalled ? (
              <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-6 py-3.5 text-base font-medium text-primary">
                <Star className="h-5 w-5 fill-primary" />
                GainAi is already installed!
              </div>
            ) : isInstallable ? (
              <Button
                size="lg"
                className="rounded-xl px-10 text-base font-semibold shadow-lg shadow-primary/25 gap-2"
                onClick={installApp}
              >
                <Download className="h-5 w-5" />
                Install GainAi
              </Button>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Button
                  size="lg"
                  className="rounded-xl px-10 text-base font-semibold shadow-lg shadow-primary/25 gap-2"
                  disabled
                >
                  <Download className="h-5 w-5" />
                  Install GainAi
                </Button>
                <p className="text-xs text-muted-foreground">
                  Open in Chrome or use your browser menu → "Add to Home Screen"
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Free · No account required to install</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
