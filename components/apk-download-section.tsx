"use client"

import { Download, Smartphone, Star, Zap, MonitorSmartphone, Flame, Dumbbell, HeartPulse, Target, MessageCircle, Camera, Gauge, Clipboard, BarChart3, Grid3x3, LogOut, Moon, Menu, Scan } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePwaInstall } from "@/hooks/use-pwa-install"

export function ApkDownloadSection() {
  const { isInstallable, isInstalled, installApp } = usePwaInstall()

  return (
    <section className="border-t border-border/50 bg-gradient-to-b from-muted/20 to-background">
      <div className="mx-auto max-w-6xl px-4 py-20 lg:px-6">
        <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-16">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left flex-1">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <MonitorSmartphone className="h-3.5 w-3.5" />
              Install on Any Device
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Take GainAi{" "}
              <span className="text-primary">everywhere</span>
            </h2>
            <p className="mt-4 max-w-md text-pretty text-base leading-relaxed text-muted-foreground">
              Install GainAi directly to your home screen — no app store needed.
              Scan food, analyze your body, and chat with your AI coach from any device.
            </p>

            <div className="mt-6 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-primary" />
                <span>Offline support</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-primary" />
                <span>Faster camera access</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-primary" />
                <span>Native app experience</span>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-start gap-3">
              {isInstalled ? (
                <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-5 py-3 text-sm font-medium text-primary">
                  <Star className="h-4 w-4 fill-primary" />
                  GainAi is already installed!
                </div>
              ) : isInstallable ? (
                <Button
                  size="lg"
                  className="rounded-xl px-8 text-base font-semibold shadow-lg shadow-primary/25 gap-2"
                  onClick={installApp}
                >
                  <Download className="h-5 w-5" />
                  Install App
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button
                    size="lg"
                    className="rounded-xl px-8 text-base font-semibold shadow-lg shadow-primary/25 gap-2"
                    disabled
                  >
                    <Download className="h-5 w-5" />
                    Install App
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    To install, use your browser menu → "Add to Home Screen"
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 flex-shrink-0">
            <div className="relative flex flex-col h-[500px] w-[250px] rounded-[2.5rem] border-8 border-foreground bg-white shadow-2xl shadow-black/20 overflow-hidden">
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
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-sm">
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
                  <div className="grid grid-cols-2 gap-2">
                    {/* Calories */}
                    <div className="border border-gray-200 rounded-lg p-2.5 bg-white">
                      <div className="flex items-center gap-1 mb-1.5">
                        <Flame className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-semibold text-gray-600">CALORIES</span>
                      </div>
                      <p className="text-lg font-bold text-black">350</p>
                      <p className="text-xs text-gray-500 mt-0.5">of 2,708 goal</p>
                      <div className="w-full h-1 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full w-1/3 bg-primary rounded-full"></div>
                      </div>
                    </div>

                    {/* Protein */}
                    <div className="border border-gray-200 rounded-lg p-2.5 bg-white">
                      <div className="flex items-center gap-1 mb-1.5">
                        <Target className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-semibold text-gray-600">PROTEIN</span>
                      </div>
                      <p className="text-lg font-bold text-black">16g</p>
                      <p className="text-xs text-gray-500 mt-0.5">of 119g goal</p>
                      <div className="w-full h-1 bg-gray-200 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full w-1/3 bg-primary rounded-full"></div>
                      </div>
                    </div>

                    {/* Diet Accuracy */}
                    <div className="border border-gray-200 rounded-lg p-2.5 bg-white">
                      <div className="flex items-center gap-1 mb-1.5">
                        <Zap className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-semibold text-gray-600">ACCURACY</span>
                      </div>
                      <p className="text-lg font-bold text-black">64%</p>
                      <p className="text-xs text-orange-500 font-medium mt-0.5">Need focus</p>
                      <p className="text-xs text-primary mt-1">↑ +12% Better</p>
                    </div>

                    {/* Body Fat */}
                    <div className="border border-gray-200 rounded-lg p-2.5 bg-white">
                      <div className="flex items-center gap-1 mb-1.5">
                        <HeartPulse className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-semibold text-gray-600">BODY FAT</span>
                      </div>
                      <p className="text-lg font-bold text-black">10%</p>
                      <p className="text-xs text-gray-500 mt-0.5">latest reading</p>
                    </div>
                  </div>
                </div>

                {/* Bottom nav */}
                <div className="border-t border-gray-200 bg-white px-4 py-2 flex items-center justify-between h-14">
                  <div className="flex flex-col items-center gap-1">
                    <Grid3x3 className="h-5 w-5 text-primary" />
                    <span className="text-xs font-medium text-primary">Dashboard</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <Scan className="h-5 w-5 text-white" />
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
  )
}
