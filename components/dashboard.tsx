"use client"

import { Activity, ScanLine, TrendingUp, Flame, Target, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const scanHistory = [
  {
    id: 1,
    type: "food",
    name: "Grilled Chicken & Rice",
    calories: 500,
    date: "Today, 12:30 PM",
  },
  {
    id: 2,
    type: "food",
    name: "Protein Shake",
    calories: 280,
    date: "Today, 8:00 AM",
  },
  {
    id: 3,
    type: "body",
    name: "Body Scan",
    calories: null,
    date: "Yesterday, 7:00 PM",
    bodyFat: "18.5%",
  },
  {
    id: 4,
    type: "food",
    name: "Salmon & Vegetables",
    calories: 420,
    date: "Yesterday, 1:00 PM",
  },
  {
    id: 5,
    type: "food",
    name: "Oatmeal & Berries",
    calories: 350,
    date: "Yesterday, 8:30 AM",
  },
]

const weeklyData = [
  { day: "Mon", calories: 2100 },
  { day: "Tue", calories: 1950 },
  { day: "Wed", calories: 2200 },
  { day: "Thu", calories: 2050 },
  { day: "Fri", calories: 2300 },
  { day: "Sat", calories: 1800 },
  { day: "Sun", calories: 2150 },
]

const maxCalories = Math.max(...weeklyData.map((d) => d.calories))

export function Dashboard() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-6">
      {/* Profile Header */}
      <div className="mb-8 flex items-center gap-4">
        <Avatar className="h-14 w-14 border-2 border-primary/20">
          <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
            JD
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome back, John
          </h1>
          <p className="text-sm text-muted-foreground">
            {"Here's your fitness overview"}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          icon={Flame}
          label="Today's Calories"
          value="780"
          subtitle="of 2,200 goal"
          progress={35}
        />
        <StatCard
          icon={Target}
          label="Protein"
          value="58g"
          subtitle="of 160g goal"
          progress={36}
        />
        <StatCard
          icon={ScanLine}
          label="Food Scans"
          value="24"
          subtitle="this week"
        />
        <StatCard
          icon={Activity}
          label="Body Fat"
          value="18.5%"
          subtitle="Athletic range"
        />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6 w-full justify-start rounded-xl bg-muted/50">
          <TabsTrigger value="overview" className="rounded-lg text-xs">
            Overview
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg text-xs">
            Scan History
          </TabsTrigger>
          <TabsTrigger value="progress" className="rounded-lg text-xs">
            Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Weekly Calories Chart */}
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">
                    Weekly Calories
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="mr-1 h-3 w-3" />
                    +5%
                  </Badge>
                </div>
                <div className="flex items-end gap-2" style={{ height: 140 }}>
                  {weeklyData.map((d) => (
                    <div
                      key={d.day}
                      className="flex flex-1 flex-col items-center gap-1"
                    >
                      <span className="text-[10px] font-semibold text-foreground">
                        {d.calories > 2000
                          ? `${(d.calories / 1000).toFixed(1)}k`
                          : d.calories}
                      </span>
                      <div
                        className="w-full rounded-t-md bg-primary/80 transition-all hover:bg-primary"
                        style={{
                          height: `${(d.calories / maxCalories) * 100}px`,
                        }}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {d.day}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Daily Macros */}
            <Card className="border-border/50">
              <CardContent className="p-5">
                <p className="mb-4 text-sm font-semibold text-foreground">
                  {"Today's Macros"}
                </p>
                <div className="flex flex-col gap-4">
                  <MacroRow label="Protein" current={58} goal={160} />
                  <MacroRow label="Carbs" current={95} goal={250} />
                  <MacroRow label="Fats" current={22} goal={70} />
                  <MacroRow label="Fiber" current={12} goal={30} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card className="border-border/50">
            <CardContent className="p-2">
              {scanHistory.map((scan) => (
                <div
                  key={scan.id}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {scan.type === "food" ? (
                      <ScanLine className="h-4 w-4" />
                    ) : (
                      <Activity className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {scan.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{scan.date}</p>
                  </div>
                  {scan.calories ? (
                    <span className="text-sm font-semibold text-foreground">
                      {scan.calories} kcal
                    </span>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-primary/10 text-xs text-primary"
                    >
                      {scan.bodyFat} BF
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-border/50">
              <CardContent className="p-5">
                <p className="mb-4 text-sm font-semibold text-foreground">
                  Body Fat Trend
                </p>
                <div className="flex flex-col gap-3">
                  {[
                    { month: "Feb 2026", value: 18.5 },
                    { month: "Jan 2026", value: 19.2 },
                    { month: "Dec 2025", value: 20.1 },
                    { month: "Nov 2025", value: 21.0 },
                  ].map((entry) => (
                    <div
                      key={entry.month}
                      className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {entry.month}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {entry.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-5">
                <p className="mb-4 text-sm font-semibold text-foreground">
                  Weekly Averages
                </p>
                <div className="flex flex-col gap-3">
                  {[
                    { label: "Avg. Calories", value: "2,079" },
                    { label: "Avg. Protein", value: "142g" },
                    { label: "Food Scans", value: "3.4/day" },
                    { label: "Consistency", value: "92%" },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5"
                    >
                      <span className="text-xs text-muted-foreground">
                        {stat.label}
                      </span>
                      <span className="text-sm font-semibold text-foreground">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  progress,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  subtitle: string
  progress?: number
}) {
  return (
    <Card className="border-border/50">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        </div>
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground">{subtitle}</p>
        {progress !== undefined && (
          <Progress value={progress} className="mt-2 h-1.5" />
        )}
      </CardContent>
    </Card>
  )
}

function MacroRow({
  label,
  current,
  goal,
}: {
  label: string
  current: number
  goal: number
}) {
  const percent = Math.round((current / goal) * 100)
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <span className="text-xs text-foreground">
          <span className="font-semibold">{current}g</span>
          <span className="text-muted-foreground"> / {goal}g</span>
        </span>
      </div>
      <Progress value={percent} className="h-2" />
    </div>
  )
}
