'use client'

import { useEffect, useState } from 'react'
import { Activity, ScanLine, TrendingUp, Flame, Target, Calendar, Loader as Loader2, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'

interface Profile {
  id: string
  name: string
  age: number
  weight: number
  height: number
  goal: string
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
  // compute displayName with fallbacks
  const displayName = profile?.name ||
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'User'

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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, name, age, weight, height, goal, calorie_goal, protein_goal, carbs_goal, fat_goal, fiber_goal, bmr, tdee, created_at')
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
            Welcome back, {displayName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {"Here's your fitness overview"}
          </p>
        </div>
      </div>

      {/* Streak Banner */}
      <Card className='mb-4 overflow-hidden border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent'>
        <CardContent className='flex items-center justify-between gap-3 px-4 py-2.5'>
          <div className='flex items-center gap-3'>
            <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-primary/20 text-primary'>
              <Flame className='h-4 w-4' />
            </div>
            <div className='leading-tight'>
              <p className='text-[10px] font-medium uppercase tracking-wider text-muted-foreground'>
                Scan Streak
              </p>
              <p className='text-base font-bold text-foreground'>
                {streak} <span className='text-xs font-medium text-muted-foreground'>{streak === 1 ? 'day' : 'days'}</span>
                <span className='ml-2 text-[11px] font-normal text-muted-foreground'>· {streakSubtitle}</span>
              </p>
            </div>
          </div>
          {streak > 0 && (
            <Badge
              className='rounded-full border-0 bg-primary/20 px-2 py-0.5 text-[10px] text-primary'
              variant='secondary'
            >
              {scannedToday ? 'Active today' : 'At risk'}
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className='mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4'>
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
          value={`${todayStats.protein}g`}
          subtitle={`of ${profile.protein_goal}g goal`}
          progress={proteinPercent}
        />
        <StatCard
          icon={ScanLine}
          label='Food Scans'
          value={weekCount.toString()}
          subtitle='this week'
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
            Edit Profile
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

            {/* Today's Meals - Overview */}
            <Card className='border-border/50'>
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
          </div>


        </TabsContent>



        <TabsContent value='profile'>
          <EditProfileTab profile={profile} user={user} onSaved={(updated) => setProfile(updated)} />
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
                        {bodyScan?.scanned_at ? formatIST(bodyScan.scanned_at) : 'N/A'}
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

const calculateGoals = (age: number, weight: number, height: number, goal: string) => {
  const bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5
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

function EditProfileTab({
  profile,
  user,
  onSaved,
}: {
  profile: Profile
  user: any
  onSaved: (updated: Profile) => void
}) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: profile.name || '',
    age: profile.age?.toString() || '',
    weight: profile.weight?.toString() || '',
    height: profile.height?.toString() || '',
    goal: profile.goal || 'maintain',
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const age = parseInt(form.age)
      const weight = parseFloat(form.weight)
      const height = parseFloat(form.height)
      const goals = calculateGoals(age, weight, height, form.goal)
      const { error: err } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: form.name,
          age,
          weight,
          height,
          goal: form.goal,
          ...goals,
        }, { onConflict: 'id' })
      if (err) throw err
      onSaved({ ...profile, name: form.name, age, weight, height, goal: form.goal, ...goals })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='grid gap-4 lg:grid-cols-2'>
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
    </div>
  )
}
