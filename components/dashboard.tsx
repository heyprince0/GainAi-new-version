'use client'

import { useEffect, useState } from 'react'
import { Activity, TrendingUp, Flame, Target, Calendar, Loader as Loader2, User, Dumbbell, Zap, Plus, Utensils } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { TodayWorkoutCard } from '@/components/today-workout-card'
import { WorkoutPlannerForm } from '@/components/workout-planner-form'
import { FuelScoreCard } from '@/components/fuel-score-card'
import { LogMealDialog } from '@/components/log-meal-dialog'

interface Profile {
  id: string
  name: string
  age: number
  weight: number
  height: number
  goal: string
  gender?: string
  // renamed fields for goals stored in Supabase
  calorie_goal: number
  protein_goal: number
  carbs_goal?: number
  fat_goal?: number
  fiber_goal?: number
  bmr?: number
  tdee?: number
  created_at: string
}

interface FoodScan {
  id?: string
  food_name: string
  calories: number
  total_calories?: number
  protein: number
  carbs: number
  fats: number
  fiber: number
  health_score?: number
  health_rating?: string
  scanned_at: string
}

interface BodyScan {
  id: string
  scanned_at: string
  body_fat_percent?: number
  body_fat?: number
  body_type?: string
}

const formatIST = (dateString: string, timeOnly = false) => {
  const date = new Date(dateString)
  if (timeOnly) {
    return date.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
} 

export function Dashboard() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [foodScans, setFoodScans] = useState<FoodScan[]>([])
  const [todayScans, setTodayScans] = useState<FoodScan[]>([])
  const [weekScans, setWeekScans] = useState<FoodScan[]>([])
  const [weekCount, setWeekCount] = useState(0)
  const [weekLabel, setWeekLabel] = useState('')
  const [bodyScan, setBodyScan] = useState<BodyScan | null>(null)
  const [showPlanner, setShowPlanner] = useState(false)
  const [hasWorkoutPlan, setHasWorkoutPlan] = useState(false)
  const [showLogMeal, setShowLogMeal] = useState(false)
  // compute displayName with fallbacks
  const displayName = profile?.name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'User'

  const refetchData = async () => {
    if (!user) return

    try {
      // Fetch today's scans
      const getTodayIST = () => {
        const now = new Date()
        const istDate = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(now)
        const istMidnightUTC = new Date(`${istDate}T00:00:00+05:30`)
        return istMidnightUTC.toISOString()
      }

      const { data: todayData } = await supabase
        .from('food_scans')
        .select('*')
        .eq('user_id', user.id)
        .gte('scanned_at', getTodayIST())
        .order('scanned_at', { ascending: false })

      if (todayData) {
        setTodayScans(todayData)
        const todayCalories = todayData.reduce((sum, s) => sum + (s.calories ?? 0), 0) ?? 0
        const todayProtein = todayData.reduce((sum, s) => sum + (s.protein ?? 0), 0) ?? 0
        const todayCarbs = todayData.reduce((sum, s) => sum + (s.carbs ?? 0), 0) ?? 0
        const todayFats = todayData.reduce((sum, s) => sum + (s.fats ?? 0), 0) ?? 0
        setTodayStats({ calories: todayCalories, protein: todayProtein, carbs: todayCarbs, fats: todayFats })
      }

      // Fetch all food scans for streak
      const { data: foodData } = await supabase
        .from('food_scans')
        .select('*')
        .eq('user_id', user.id)
        .order('scanned_at', { ascending: false })

      if (foodData) setFoodScans(foodData)

      // Fetch fuel scores
      const istDateKey = (iso: string) =>
        new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date(iso))

      const todayDate = istDateKey(new Date().toISOString())
      const yesterdayDate = istDateKey(new Date(Date.now() - 86400000).toISOString())

      const { data: fuelData } = await supabase
        .from('fuel_scores')
        .select('score_date, fuel_score')
        .eq('user_id', user.id)
        .in('score_date', [todayDate, yesterdayDate])

      if (fuelData) {
        const todayFuel = fuelData.find((r) => r.score_date === todayDate)?.fuel_score ?? null
        const yesterdayFuel = fuelData.find((r) => r.score_date === yesterdayDate)?.fuel_score ?? null
        setTodayFuelScore(todayFuel)
        setYesterdayFuelScore(yesterdayFuel)
      }
    } catch (error) {
      console.error('Error refetching data:', error)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#00ff88'
    if (score >= 6) return '#86efac'
    if (score >= 4) return '#facc15'
    if (score >= 2) return '#fb923c'
    return '#ef4444'
  }

  const normalizeScore = (score: number) => {
    if (!score) return 0
    // convert old 0-100 scores, clamp, then round to whole number
    let s = score > 10 ? score / 10 : score
    s = Math.min(Math.max(s, 0), 10)
    return Math.round(s)
  }
  const [todayStats, setTodayStats] = useState({ calories: 0, protein: 0, carbs: 0, fats: 0 })
  const [todayFuelScore, setTodayFuelScore] = useState<number | null>(null)
  const [yesterdayFuelScore, setYesterdayFuelScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, age, weight, height, goal, gender, calorie_goal, protein_goal, carbs_goal, fat_goal, fiber_goal, bmr, tdee, created_at')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Profile error:', profileError)
        }
        if (profileData) setProfile(profileData)

        // IST daily reset: get midnight IST in UTC format
        const getTodayIST = () => {
          // Get current time in IST
          const now = new Date()
          
          // Format today's date in IST timezone
          const istDate = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).format(now)
          
          // istDate is like "2026-03-12"
          // Convert IST midnight to UTC for Supabase query
          // IST midnight = UTC 18:30 previous day
          const istMidnightUTC = new Date(`${istDate}T00:00:00+05:30`)
          
          return istMidnightUTC.toISOString()
        }

        const getWeekStart = () => {
          const now = new Date()
          const day = now.getDay()
          const diff = now.getDate() - day + (day === 0 ? -6 : 1)
          const monday = new Date(now.setDate(diff))
          monday.setHours(0, 0, 0, 0)
          return monday
        }
        const weekStart = getWeekStart()

        // Fetch today's scans using IST midnight
        const { data: todayData, error: todayError } = await supabase
          .from('food_scans')
          .select('*')
          .eq('user_id', user.id)
          .gte('scanned_at', getTodayIST())
          .order('scanned_at', { ascending: false })

        if (todayError) console.error('Today scans error:', todayError)
        const todayScans = todayData || []
        setTodayScans(todayScans)

        const todayCalories = todayScans.reduce((sum, s) => sum + (s.calories ?? 0), 0) ?? 0
        const todayProtein = todayScans.reduce((sum, s) => sum + (s.protein ?? 0), 0) ?? 0
        const todayCarbs = todayScans.reduce((sum, s) => sum + (s.carbs ?? 0), 0) ?? 0
        const todayFats = todayScans.reduce((sum, s) => sum + (s.fats ?? 0), 0) ?? 0
        setTodayStats({ calories: todayCalories, protein: todayProtein, carbs: todayCarbs, fats: todayFats })

        // fetch week scans
        const { data: weekData, error: weekError } = await supabase
          .from('food_scans')
          .select('*')
          .eq('user_id', user.id)
          .gte('scanned_at', weekStart.toISOString())
          .order('scanned_at', { ascending: false })

        if (weekError) console.error('Week scans error:', weekError)
        const weeks = weekData || []
        setWeekScans(weeks)
        setWeekCount(weeks.length)
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekEnd.getDate() + 6)
        const label = `${weekStart.toLocaleDateString('en-IN', {month:'short', day:'numeric', timeZone: 'Asia/Kolkata'})} - ${weekEnd.toLocaleDateString('en-IN', {month:'short', day:'numeric', timeZone: 'Asia/Kolkata'})}`
        setWeekLabel(label)

        // still keep full foodScans array if you want all history later
        const { data: foodData, error: foodError } = await supabase
          .from('food_scans')
          .select('*')
          .eq('user_id', user.id)
          .order('scanned_at', { ascending: false })
        if (foodError) console.error('Food scans error:', foodError)
        if (foodData) setFoodScans(foodData)

        // Fetch latest body scan
        const { data: bodyData, error: bodyError } = await supabase
          .from('body_scans')
          .select('*')
          .eq('user_id', user.id)
          .order('scanned_at', { ascending: false })
          .limit(1)
        
        if (bodyError) console.error('Body scan error:', bodyError)
        if (bodyData && bodyData.length > 0) setBodyScan(bodyData[0])

        // Check if user has a workout plan
        const { data: planData, error: planError } = await supabase
          .from('workout_plans')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
        
        if (planError) console.error('Workout plan error:', planError)
        setHasWorkoutPlan(planData && planData.length > 0)

        // Fetch fuel scores for today and yesterday
        const istDateKey = (iso: string) =>
          new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(new Date(iso))

        const todayDate = istDateKey(new Date().toISOString())
        const yesterdayDate = istDateKey(new Date(Date.now() - 86400000).toISOString())

        const { data: fuelData, error: fuelError } = await supabase
          .from('fuel_scores')
          .select('score_date, fuel_score')
          .eq('user_id', user.id)
          .in('score_date', [todayDate, yesterdayDate])

        if (fuelError) console.error('Fuel scores error:', fuelError)
        const todayFuel = fuelData?.find((r) => r.score_date === todayDate)?.fuel_score ?? null
        const yesterdayFuel = fuelData?.find((r) => r.score_date === yesterdayDate)?.fuel_score ?? null
        setTodayFuelScore(todayFuel)
        setYesterdayFuelScore(yesterdayFuel)
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

  if (!profile) return null // wait until profile is loaded

  const calPercent = profile.calorie_goal
    ? Math.round((todayStats.calories / profile.calorie_goal) * 100)
    : 0
  const proteinPercent = profile.protein_goal
    ? Math.round((todayStats.protein / profile.protein_goal) * 100)
    : 0
  const initials = (profile.name || displayName)
    .split(' ')
    .map((n: string) => n[0])
    .join('') || ''

  const calculateStreak = (scans: FoodScan[]) => {
    if (!scans || scans.length === 0) return 0
    const istDateKey = (iso: string) =>
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(new Date(iso))

    const days = new Set(scans.map((s) => istDateKey(s.scanned_at)))
    const todayKey = istDateKey(new Date().toISOString())

    let cursor = new Date(`${todayKey}T00:00:00+05:30`)
    if (!days.has(todayKey)) {
      cursor.setDate(cursor.getDate() - 1)
    }

    let streak = 0
    while (true) {
      const key = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(cursor)
      if (!days.has(key)) break
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    }
    return streak
  }

  const streak = calculateStreak(foodScans)
  const scannedToday = todayScans.length > 0
  const streakSubtitle = streak === 0
    ? 'Scan a meal to start'
    : scannedToday
      ? 'Keep it up!'
      : 'Scan today to keep it alive'

  return (
    <div className='mx-auto max-w-2xl w-full px-4 py-10'>
      {/* Profile Header */}
        <div>
          <h1 className='text-2xl font-bold tracking-tight text-foreground'>
            Welcome back, {displayName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {"Here's your fitness overview"}
          </p>
        </div>
      

      {/* Streak Banner - Compact Single Row */}
      <div className='flex items-center gap-2 px-1 py-2 mb-4'>
        <Flame className={`h-5 w-5 ${todayScans.length > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
        <div className='flex items-baseline gap-1'>
          <span className='text-lg font-bold text-foreground'>{streak}</span>
          <span className='text-xs text-muted-foreground'>day streak</span>
        </div>
        {streak > 0 && !scannedToday && (
          <Badge
            className='rounded-full border-0 bg-red-500/20 px-2 py-0.5 text-[10px] text-red-500 ml-auto'
            variant='secondary'
          >
            At risk
          </Badge>
        )}
      </div>

      {!hasWorkoutPlan && (
        <button
          onClick={() => setShowPlanner(true)}
          className="w-full py-2 mb-6 bg-gradient-to-r from-primary to-[#00cc6a] text-black font-semibold rounded-xl text-sm"
        >
          Create Workout Plan ✨
        </button>
      )}

      <TodayWorkoutCard
        userId={user?.id ?? ''}
        onCreatePlan={() => setShowPlanner(true)}
      />

      {/* Quick Stats */}
      <div className='mb-6 grid grid-cols-2 md:grid-cols-4 gap-3'>
        <StatCard
          icon={Flame}
          label="Today's Calories"
          value={todayStats.calories.toString()}
          subtitle={`of ${(profile.calorie_goal ?? 0).toLocaleString()} goal`}
          progress={calPercent}
        />
        <StatCard
          icon={Target}
          label='Protein'
          value={`${Math.round(todayStats.protein)}g`}
          subtitle={`of ${profile.protein_goal}g goal`}
          progress={proteinPercent}
        />
        <FuelScoreCard
          todayScore={todayFuelScore}
          yesterdayScore={yesterdayFuelScore}
          hasMealsLogged={todayScans.length > 0}
        />
        <StatCard
          icon={Activity}
          label='Body Fat'
          value={bodyScan?.body_fat ? `${bodyScan.body_fat}%` : 'No scan yet'}
          subtitle='latest reading'
        />
      </div>

      <Tabs defaultValue='overview' className='w-full'>
        <TabsList className='mb-6 w-full justify-start rounded-xl bg-muted/50'>
          <TabsTrigger value='overview' className='rounded-lg text-xs'>
            Overview
          </TabsTrigger>
          <TabsTrigger value='progress' className='rounded-lg text-xs'>
            Progress
          </TabsTrigger>
          <TabsTrigger value='profile' className='rounded-lg text-xs'>
            Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value='overview'>
          <div className='grid gap-4 lg:grid-cols-2'>
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
                    goal={profile.protein_goal}
                  />
                  <MacroRow
                    label='Carbs'
                    current={todayStats.carbs}
                    goal={profile?.carbs_goal ?? 0}
                  />
                  <MacroRow label='Fats' current={todayStats.fats} goal={profile?.fat_goal ?? 0} />
                </div>
              </CardContent>
            </Card>

            {/* Log Meal Button */}
            <button
              onClick={() => setShowLogMeal(true)}
              className='w-full lg:col-span-2 py-3 bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold rounded-xl text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity'
            >
              <Plus className='h-4 w-4' />
              Log a Meal
            </button>
          </div>

            {/* Today's Meals - Overview */}
            <Card className='border-border/50 mt-4'>
              <CardContent className='p-2'>
                {todayScans.length > 0 ? (
                  todayScans.map((scan) => {
                    const raw = scan.health_score ?? 0
                    const score = normalizeScore(raw)
                    const color = getScoreColor(score)
                    return (
                      <div
                        key={scan.id ?? scan.scanned_at}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '10px',
                          borderLeft: `4px solid ${color}`,
                          background: `${color}12`,
                          marginBottom: '8px',
                        }}
                      >
                        <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                          {scan.food_name || 'Food Scan'}
                        </div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: color }}>
                          {scan.calories ?? 0} kcal · {Math.round(score)}/10 · {scan.health_rating ?? 'Average'}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className='p-4 text-center'>
                    <p className='text-sm text-muted-foreground'>No meals scanned today</p>
                  </div>
                )}
              </CardContent>
            </Card>

            


        </TabsContent>



        <TabsContent value='profile'>
          <EditProfileTab profile={profile} user={user} onSaved={(updated) => setProfile(updated)} hasWorkoutPlan={hasWorkoutPlan} onOpenPlanner={() => setShowPlanner(true)} />
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
                        {(bodyScan.body_fat ?? bodyScan.body_fat_percent) ?? 'N/A'}%
                      </span>
                    </div>
                    <div className='flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5'>
                      <span className='text-xs text-muted-foreground'>
                        Last Updated
                      </span>
                      <span className='text-sm font-semibold text-foreground'>
                        {bodyScan?.scanned_at ? new Date(bodyScan.scanned_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'Asia/Kolkata' }) : 'N/A'}
                      </span>
                    </div>
                    {bodyScan?.body_type && (
                      <div style={{
                        display: 'inline-block',
                        marginTop: '8px',
                        padding: '4px 14px',
                        borderRadius: '20px',
                        fontSize: '13px',
                        fontWeight: '600',
                        background:
                          bodyScan.body_type === 'Athletic' || bodyScan.body_type === 'Mesomorph' ? '#00ff88' :
                          bodyScan.body_type === 'Ectomorph' || bodyScan.body_type === 'Skinny' ? '#3b82f6' :
                          bodyScan.body_type === 'Fat' ? '#ef4444' :
                          bodyScan.body_type === 'Obese' ? '#dc2626' :
                          bodyScan.body_type === 'Overweight' ? '#f97316' : '#6b7280',
                        color: '#000'
                      }}>
                        {bodyScan.body_type}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className='text-sm text-muted-foreground'>No body scans yet</p>
                )}
              </CardContent>
            </Card>

            <Card className='border-border/50'>
              <CardContent className='p-5'>
                <p className='mb-1 text-sm font-semibold text-foreground'>
                  Weekly Summary
                </p>
                {weekLabel && (
                  <p className='mb-4 text-xs text-muted-foreground'>
                    {weekLabel}
                  </p>
                )}
                <div className='flex flex-col gap-3'>
                  <div className='flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5'>
                    <span className='text-xs text-muted-foreground'>
                      Total Scans
                    </span>
                    <span className='text-sm font-semibold text-foreground'>
                      {weekCount}
                    </span>
                  </div>
                  <div className='flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5'>
                    <span className='text-xs text-muted-foreground'>
                      Avg. Daily Calories
                    </span>
                    <span className='text-sm font-semibold text-foreground'>
                      {weekScans.length > 0
                        ? Math.round(
                            weekScans.reduce((sum, s) => sum + ((s?.total_calories ?? s?.calories) || 0), 0) / 7
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

      {showPlanner && (
        <div className="fixed inset-0 z-[10000] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-4">
          <div className="w-full max-w-lg sm:rounded-2xl rounded-none sm:max-h-[90vh] max-h-screen overflow-y-auto bg-background border border-border">
            <WorkoutPlannerForm
              userId={user?.id ?? ''}
              existingBodyFat={bodyScan?.body_fat_percent}
              onComplete={() => {
                setShowPlanner(false)
                window.location.reload()
              }}
            />
          </div>
        </div>
      )}

      <LogMealDialog
        open={showLogMeal}
        onOpenChange={setShowLogMeal}
        onMealSaved={refetchData}
      />
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
          <span className='font-semibold'>
  {Number(current.toFixed(1))}g
</span>
<span className='text-muted-foreground'>
  / {Number(goal.toFixed(1))}g
</span>
      </div>
      <Progress value={Math.min(percent, 100)} className='h-2' />
    </div>
  )
}

const calculateGoals = (age: number, weight: number, height: number, goal: string, gender: string) => {
  const bmrConstant = gender === 'Male' ? 5 : -161
  const bmr = (10 * weight) + (6.25 * height) - (5 * age) + bmrConstant
  const tdee = Math.round(bmr * 1.55)
  let calories = goal === 'lose' ? tdee - 500 : goal === 'gain' ? tdee + 300 : tdee
  const protein = Math.round(weight * (goal === 'gain' ? 2.2 : goal === 'lose' ? 2.0 : 1.8))
  const fat = Math.round((calories * 0.25) / 9)
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4)
  const fiber = Math.round((calories / 1000) * 14)
  return {
    calorie_goal: calories,
    protein_goal: protein,
    carbs_goal: Math.max(carbs, 50),
    fat_goal: fat,
    fiber_goal: fiber,
  }
}

const cleanName = (name: string) => name.replace(/\s[A-C]$/i, '').trim()

const dayAbbreviations = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function EditProfileTab({
  profile,
  user,
  onSaved,
  hasWorkoutPlan,
  onOpenPlanner,
}: {
  profile: Profile
  user: any
  onSaved: (updated: Profile) => void
  hasWorkoutPlan: boolean
  onOpenPlanner: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [weeklyPlan, setWeeklyPlan] = useState<any>(null)
  const [form, setForm] = useState({
    name: profile.name || '',
    age: profile.age?.toString() || '',
    weight: profile.weight?.toString() || '',
    height: profile.height?.toString() || '',
    goal: profile.goal || 'maintain',
    gender: profile.gender || '',
  })

  useEffect(() => {
    const fetchWeeklyPlan = async () => {
      try {
        const { data, error: err } = await supabase
          .from('workout_plans')
          .select('plan')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        
        if (err && err.code !== 'PGRST116') {
          console.error('Error fetching weekly plan:', err)
        }
        if (data) {
          setWeeklyPlan(data.plan)
        }
      } catch (err) {
        console.error('Error fetching weekly plan:', err)
      }
    }
    
    if (user?.id) {
      fetchWeeklyPlan()
    }
  }, [user?.id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const age = parseInt(form.age)
      const weight = parseFloat(form.weight)
      const height = parseFloat(form.height)
      const goals = calculateGoals(age, weight, height, form.goal, form.gender)
      const { error: err } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: form.name,
          age,
          weight,
          height,
          goal: form.goal,
          gender: form.gender || null,
          ...goals,
        }, { onConflict: 'id' })
      if (err) throw err
      onSaved({ ...profile, name: form.name, age, weight, height, goal: form.goal, gender: form.gender || undefined, ...goals })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
      <Card className='border-border/50'>
        <CardContent className='p-5'>
          <div className='mb-4 flex items-center gap-2'>
            <User className='h-4 w-4 text-primary' />
            <p className='text-sm font-semibold text-foreground'>Personal Info</p>
          </div>
          <form onSubmit={handleSave} className='flex flex-col gap-4'>
            <div>
              <label className='mb-1 block text-xs font-medium text-muted-foreground'>Full Name</label>
              <input
                type='text'
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none'
                placeholder='Your name'
                required
              />
            </div>
            <div>
              <label className='mb-1 block text-xs font-medium text-muted-foreground'>Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className='w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none'
              >
                <option value=''>Select gender</option>
                <option value='Male'>Male</option>
                <option value='Female'>Female</option>
                <option value='Other'>Other</option>
              </select>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='mb-1 block text-xs font-medium text-muted-foreground'>Age</label>
                <input
                  type='number'
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                  className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none'
                  min='13' max='120' required
                />
              </div>
              <div>
                <label className='mb-1 block text-xs font-medium text-muted-foreground'>Weight (kg)</label>
                <input
                  type='number'
                  value={form.weight}
                  onChange={(e) => setForm({ ...form, weight: e.target.value })}
                  className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none'
                  min='30' step='0.1' required
                />
              </div>
            </div>
            <div>
              <label className='mb-1 block text-xs font-medium text-muted-foreground'>Height (cm)</label>
              <input
                type='number'
                value={form.height}
                onChange={(e) => setForm({ ...form, height: e.target.value })}
                className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none'
                min='100' max='250' required
              />
            </div>
            <div>
              <label className='mb-1 block text-xs font-medium text-muted-foreground'>Fitness Goal</label>
              <select
                value={form.goal}
                onChange={(e) => setForm({ ...form, goal: e.target.value })}
                className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none'
                required
              >
                <option value='lose'>Lose Weight</option>
                <option value='maintain'>Maintain Weight</option>
                <option value='gain'>Gain Muscle</option>
              </select>
            </div>
            {error && (
              <div className='rounded-lg border border-red-500/50 bg-red-500/5 p-3'>
                <p className='text-xs text-red-600'>{error}</p>
              </div>
            )}
            {success && (
              <div className='rounded-lg border border-primary/30 bg-primary/5 p-3'>
                <p className='text-xs text-primary font-medium'>Profile updated successfully!</p>
              </div>
            )}
            <Button type='submit' disabled={loading} className='w-full rounded-lg'>
              {loading ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : null}
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className='border-border/50'>
        <CardContent className='p-5'>
          <p className='mb-4 text-sm font-semibold text-foreground'>Current Goals</p>
          <div className='flex flex-col gap-3'>
            {[
              { label: 'Daily Calories', value: `${profile.calorie_goal ?? 0} kcal` },
              { label: 'Protein Goal', value: `${profile.protein_goal ?? 0}g` },
              { label: 'Carbs Goal', value: `${profile.carbs_goal ?? 0}g` },
              { label: 'Fat Goal', value: `${profile.fat_goal ?? 0}g` },
              { label: 'Fiber Goal', value: `${profile.fiber_goal ?? 0}g` },
            ].map((item) => (
              <div key={item.label} className='flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5'>
                <span className='text-xs text-muted-foreground'>{item.label}</span>
                <span className='text-sm font-semibold text-foreground'>{item.value}</span>
              </div>
            ))}
          </div>
          <p className='mt-4 text-[10px] text-muted-foreground'>
            Goals are recalculated automatically when you save changes to your profile.
          </p>
        </CardContent>
      </Card>

      {/* Workout Plan Card */}
      <Card className='border-border/50 lg:col-span-2'>
        <CardContent className='p-5'>
          <div className='mb-3 flex items-center gap-2'>
            <Dumbbell className='h-4 w-4 text-primary' />
            <p className='text-sm font-semibold text-foreground'>Workout Plan</p>
          </div>
          
          {weeklyPlan && weeklyPlan.days && (
            <div className='mb-4'>
              <p className='text-sm font-semibold text-foreground mb-2'>This Week&apos;s Plan</p>
              <div className='flex gap-2 overflow-x-auto pb-2 scrollbar-hide'>
                {dayAbbreviations.map((dayAbbr, idx) => {
                  const dayNumber = idx + 1 // Mon=1, Tue=2, ..., Sun=7
                  const workoutDay = weeklyPlan.days.find((d: any) => d.day_number === dayNumber)
                  return (
                    <div
                      key={dayAbbr}
                      className={`flex-shrink-0 px-2 py-2 rounded-xl text-xs text-center min-w-[48px] ${
                        workoutDay
                          ? 'bg-[#00ff88]/20 border border-[#00ff88]/50 text-[#00cc6a]'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <div className='font-bold'>{dayAbbr}</div>
                      <div className='text-[10px] mt-0.5'>
                        {workoutDay ? cleanName(workoutDay.focus) : 'Rest'}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
          
          <p className='mb-4 text-xs text-muted-foreground'>
            {hasWorkoutPlan
              ? 'Create a new AI-generated workout plan based on your current profile and goals.'
              : 'Let AI build your personalized weekly workout plan.'}
          </p>
          <Button
            onClick={onOpenPlanner}
            className='w-full bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold rounded-xl py-2.5 text-sm mt-3 hover:opacity-90'
          >
            {hasWorkoutPlan ? 'Regenerate Workout Plan ✨' : 'Create Workout Plan ✨'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
