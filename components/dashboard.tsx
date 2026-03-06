'use client'

import { useEffect, useState } from 'react'
import { Activity, ScanLine, TrendingUp, Flame, Target, Calendar, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

interface Profile {
  full_name: string
  daily_calories: number
  daily_protein: number
}

interface FoodScan {
  id: string
  created_at: string
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fats: number
  foods: any[]
}

interface BodyScan {
  id: string
  created_at: string
  body_fat_percent: number
}

export function Dashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [foodScans, setFoodScans] = useState<FoodScan[]>([])
  const [bodyScan, setBodyScan] = useState<BodyScan | null>(null)
  const [todayStats, setTodayStats] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select()
          .eq('id', user.id)
          .single()
        if (profileData) setProfile(profileData)

        // Fetch food scans
        const { data: foodData } = await supabase
          .from('food_scans')
          .select()
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        if (foodData) setFoodScans(foodData)

        // Fetch latest body scan
        const { data: bodyData } = await supabase
          .from('body_scans')
          .select()
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        if (bodyData) setBodyScan(bodyData)

        // Calculate today's stats
        const today = new Date().toISOString().split('T')[0]
        const todayScans = foodData?.filter(
          (scan) => scan.created_at.startsWith(today)
        ) || []
        const totalCalories = todayScans.reduce((sum, scan) => sum + (scan.total_calories || 0), 0)
        const totalProtein = todayScans.reduce((sum, scan) => sum + (scan.total_protein || 0), 0)
        const totalCarbs = todayScans.reduce((sum, scan) => sum + (scan.total_carbs || 0), 0)
        const totalFats = todayScans.reduce((sum, scan) => sum + (scan.total_fats || 0), 0)

        setTodayStats({ calories: totalCalories, protein: totalProtein, carbs: totalCarbs, fats: totalFats })
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    )
  }

  if (!profile) return null

  const calPercent = Math.round((todayStats.calories / profile.daily_calories) * 100)
  const proteinPercent = Math.round((todayStats.protein / profile.daily_protein) * 100)
  const initials = profile.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')

  return (
    <div className='mx-auto max-w-4xl px-4 py-10 lg:px-6'>
      {/* Profile Header */}
      <div className='mb-8 flex items-center gap-4'>
        <Avatar className='h-14 w-14 border-2 border-primary/20'>
          <AvatarFallback className='bg-primary/10 text-lg font-bold text-primary'>
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-foreground'>
            Welcome back, {profile.full_name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {"Here's your fitness overview"}
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className='mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4'>
        <StatCard
          icon={Flame}
          label="Today's Calories"
          value={todayStats.calories.toString()}
          subtitle={`of ${profile.daily_calories.toLocaleString()} goal`}
          progress={calPercent}
        />
        <StatCard
          icon={Target}
          label='Protein'
          value={`${todayStats.protein}g`}
          subtitle={`of ${profile.daily_protein}g goal`}
          progress={proteinPercent}
        />
        <StatCard
          icon={ScanLine}
          label='Food Scans'
          value={foodScans.length.toString()}
          subtitle='total scans'
        />
        <StatCard
          icon={Activity}
          label='Body Fat'
          value={bodyScan ? `${bodyScan.body_fat_percent}%` : 'N/A'}
          subtitle='latest reading'
        />
      </div>

      <Tabs defaultValue='overview' className='w-full'>
        <TabsList className='mb-6 w-full justify-start rounded-xl bg-muted/50'>
          <TabsTrigger value='overview' className='rounded-lg text-xs'>
            Overview
          </TabsTrigger>
          <TabsTrigger value='history' className='rounded-lg text-xs'>
            Scan History
          </TabsTrigger>
          <TabsTrigger value='progress' className='rounded-lg text-xs'>
            Progress
          </TabsTrigger>
        </TabsList>

        <TabsContent value='overview'>
          <div className='grid gap-4 lg:grid-cols-2'>
            {/* Latest Scans Chart */}
            <Card className='border-border/50'>
              <CardContent className='p-5'>
                <div className='mb-4 flex items-center justify-between'>
                  <p className='text-sm font-semibold text-foreground'>
                    Recent Scans
                  </p>
                  <Badge variant='secondary' className='text-xs'>
                    <TrendingUp className='mr-1 h-3 w-3' />
                    {foodScans.length} scans
                  </Badge>
                </div>
                <div className='space-y-2'>
                  {foodScans.slice(0, 5).map((scan) => (
                    <div
                      key={scan.id}
                      className='flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2'
                    >
                      <span className='text-xs text-muted-foreground'>
                        {new Date(scan.created_at).toLocaleDateString()}
                      </span>
                      <span className='text-sm font-semibold'>
                        {scan.total_calories} kcal
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Today's Macros */}
            <Card className='border-border/50'>
              <CardContent className='p-5'>
                <p className='mb-4 text-sm font-semibold text-foreground'>
                  {"Today's Macros"}
                </p>
                <div className='flex flex-col gap-4'>
                  <MacroRow
                    label='Protein'
                    current={todayStats.protein}
                    goal={profile.daily_protein}
                  />
                  <MacroRow
                    label='Carbs'
                    current={todayStats.carbs}
                    goal={250}
                  />
                  <MacroRow label='Fats' current={todayStats.fats} goal={70} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='history'>
          <Card className='border-border/50'>
            <CardContent className='p-2'>
              {foodScans.length > 0 ? (
                foodScans.map((scan) => (
                  <div
                    key={scan.id}
                    className='flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted/50'
                  >
                    <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary'>
                      <ScanLine className='h-4 w-4' />
                    </div>
                    <div className='flex-1'>
                      <p className='text-sm font-medium text-foreground'>
                        {scan.foods?.[0]?.name || 'Food Scan'}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {new Date(scan.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className='text-sm font-semibold text-foreground'>
                      {scan.total_calories} kcal
                    </span>
                  </div>
                ))
              ) : (
                <div className='p-4 text-center'>
                  <p className='text-sm text-muted-foreground'>No scans yet. Start by scanning a meal!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='progress'>
          <div className='grid gap-4 lg:grid-cols-2'>
            <Card className='border-border/50'>
              <CardContent className='p-5'>
                <p className='mb-4 text-sm font-semibold text-foreground'>
                  Latest Body Scan
                </p>
                {bodyScan ? (
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5'>
                      <span className='text-xs text-muted-foreground'>
                        Body Fat
                      </span>
                      <span className='text-sm font-semibold text-foreground'>
                        {bodyScan.body_fat_percent}%
                      </span>
                    </div>
                    <div className='flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5'>
                      <span className='text-xs text-muted-foreground'>
                        Last Updated
                      </span>
                      <span className='text-sm font-semibold text-foreground'>
                        {new Date(bodyScan.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className='text-sm text-muted-foreground'>No body scans yet</p>
                )}
              </CardContent>
            </Card>

            <Card className='border-border/50'>
              <CardContent className='p-5'>
                <p className='mb-4 text-sm font-semibold text-foreground'>
                  Weekly Summary
                </p>
                <div className='flex flex-col gap-3'>
                  <div className='flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5'>
                    <span className='text-xs text-muted-foreground'>
                      Total Scans
                    </span>
                    <span className='text-sm font-semibold text-foreground'>
                      {foodScans.length}
                    </span>
                  </div>
                  <div className='flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5'>
                    <span className='text-xs text-muted-foreground'>
                      Avg. Daily Calories
                    </span>
                    <span className='text-sm font-semibold text-foreground'>
                      {foodScans.length > 0
                        ? Math.round(
                            foodScans.reduce((sum, s) => sum + s.total_calories, 0) /
                              Math.ceil(
                                (new Date().getTime() -
                                  new Date(foodScans[foodScans.length - 1].created_at).getTime()) /
                                  (1000 * 60 * 60 * 24) || 1
                              )
                          )
                        : 0}
                    </span>
                  </div>
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
    <Card className='border-border/50'>
      <CardContent className='p-4'>
        <div className='mb-2 flex items-center gap-2'>
          <Icon className='h-4 w-4 text-primary' />
          <span className='text-[10px] font-medium uppercase tracking-wider text-muted-foreground'>
            {label}
          </span>
        </div>
        <p className='text-xl font-bold text-foreground'>{value}</p>
        <p className='mt-0.5 text-[10px] text-muted-foreground'>{subtitle}</p>
        {progress !== undefined && (
          <Progress value={Math.min(progress, 100)} className='mt-2 h-1.5' />
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
      <div className='mb-1 flex items-center justify-between'>
        <span className='text-xs font-medium text-muted-foreground'>
          {label}
        </span>
        <span className='text-xs text-foreground'>
          <span className='font-semibold'>{current}g</span>
          <span className='text-muted-foreground'> / {goal}g</span>
        </span>
      </div>
      <Progress value={Math.min(percent, 100)} className='h-2' />
    </div>
  )
}
