'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Activity, CheckCircle2, Loader2, X } from 'lucide-react'

interface Props {
  userId: string
  onCreatePlan: () => void
}

interface WorkoutDay {
  day_number: number
  day_name: string
  focus: string
  duration_minutes: number
  exercises: Array<{
    name: string
    sets: number
    reps: string
    rest_seconds: number
    notes: string
  }>
  warm_up: string
  cool_down: string
}

const cleanName = (name: string) => name.replace(/\s[A-C]$/i, '').trim()

interface WorkoutLog {
  id: string
  plan_id: string
  day_name: string
  completed: boolean
  completed_at: string | null
}

interface WorkoutPlan {
  id: string
  plan: {
    plan_name: string
    goal_summary: string
    days: WorkoutDay[]
    rest_days?: number[]
    tips?: string
  }
}

export function TodayWorkoutCard({ userId, onCreatePlan }: Props) {
  const [state, setState] = useState<'loading' | 'no-plan' | 'rest-day' | 'not-completed' | 'completed'>('loading')
  const [todayLog, setTodayLog] = useState<WorkoutLog | null>(null)
  const [todayWorkout, setTodayWorkout] = useState<WorkoutDay | null>(null)
  const [planName, setPlanName] = useState('')
  const [goalSummary, setGoalSummary] = useState('')
  const [showExerciseModal, setShowExerciseModal] = useState(false)

  useEffect(() => {
    const fetchTodayWorkout = async () => {
      try {
        const today = new Date()
        const jsDayOfWeek = today.getDay()
        // Convert JS day (0=Sun,1=Mon...6=Sat) to plan day_number (1=Mon,2=Tue...7=Sun)
        const planDayNumber = jsDayOfWeek === 0 ? 7 : jsDayOfWeek

        // Fetch latest active workout plan
        const { data: planData, error: planError } = await supabase
          .from('workout_plans')
          .select('id, plan, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (planError && planError.code === 'PGRST116') {
          // No plan exists
          setState('no-plan')
          return
        }

        if (planError) throw planError

        const plan = planData.plan as WorkoutPlan['plan']
        const planId = planData.id
        setPlanName(plan.plan_name || '')
        setGoalSummary(plan.goal_summary || '')

        // Find today's workout in the plan
        const todayDay = plan.days.find((d: any) => d.day_number === planDayNumber)
        const todayDayWorkout = todayDay ? { ...todayDay, day_name: cleanName(todayDay.day_name), exercises: todayDay.exercises.map((ex: any) => ({ ...ex, name: cleanName(ex.name) })) } : undefined

        if (!todayDayWorkout) {
          // Rest day - day not in plan
          setState('rest-day')
          return
        }

        // Found a workout for today
        setTodayWorkout(todayDayWorkout)

        // Check if already logged and completed today
        const { data: logData, error: logError } = await supabase
          .from('workout_logs')
          .select('id, completed, completed_at')
          .eq('user_id', userId)
          .eq('plan_id', planId)
          .eq('day_name', todayDayWorkout.day_name)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (logError && logError.code === 'PGRST116') {
          // No log exists for today, create one
          const { data: newLog, error: insertError } = await supabase
            .from('workout_logs')
            .insert({
              user_id: userId,
              plan_id: planId,
              day_name: todayDayWorkout.day_name,
              day_of_week: todayDayNumber,
              completed: false,
            })
            .select()
            .single()

          if (insertError) throw insertError
          setTodayLog(newLog)
          setState('not-completed')
          return
        }

        if (logError) throw logError

        setTodayLog(logData)
        setState(logData.completed ? 'completed' : 'not-completed')
      } catch (error) {
        console.error('Error fetching workout:', error)
        setState('no-plan')
      }
    }

    fetchTodayWorkout()
  }, [userId])

  const handleMarkComplete = async () => {
    if (!todayLog) return

    try {
      const { error } = await supabase
        .from('workout_logs')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('id', todayLog.id)

      if (error) throw error

      setState('completed')
    } catch (error) {
      console.error('Error marking workout complete:', error)
    }
  }

  if (state === 'loading') {
    return (
      <Card className="bg-card border border-border rounded-2xl mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (state === 'no-plan') {
    return null
  }

  if (state === 'rest-day') {
    return (
      <Card className="bg-card border border-border rounded-2xl mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="text-3xl">😴</div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Rest Day</h3>
              <p className="text-xs text-muted-foreground">Recovery is progress</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (state === 'not-completed' && todayWorkout) {
    return (
      <>
        <Card className="bg-card border border-border rounded-2xl mb-6">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Activity className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">{cleanName(todayWorkout.day_name)}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {todayWorkout.exercises.length} exercises · {todayWorkout.duration_minutes} mins
                </p>
              </div>
              <Badge className="bg-primary/20 text-primary border-0 text-xs">
                {cleanName(todayWorkout.focus)}
              </Badge>
            </div>

            <Button
              onClick={() => setShowExerciseModal(true)}
              className="w-full mt-4 bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold rounded-xl"
            >
              View Workout →
            </Button>
          </CardContent>
        </Card>

        {showExerciseModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end">
            <div className="w-full bg-background border-t border-border rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {planName}
                  </h3>
                  <h2 className="text-xl font-bold text-foreground">{cleanName(todayWorkout.day_name)}</h2>
                  <p className="text-sm text-muted-foreground mt-1">{goalSummary}</p>
                </div>
                <button
                  onClick={() => setShowExerciseModal(false)}
                  className="text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Warm-up */}
                <div className="p-4 bg-card border border-border rounded-xl">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Warm-up
                  </p>
                  <p className="text-sm text-foreground">{todayWorkout.warm_up}</p>
                </div>

                {/* Exercises */}
                {todayWorkout.exercises.map((exercise, idx) => (
                  <div key={idx} className="p-4 bg-card border border-border rounded-xl">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-foreground">{cleanName(exercise.name)}</h3>
                      <Badge className="bg-primary/20 text-primary border-0 text-xs">
                        {exercise.sets}x {exercise.reps}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">Rest: {exercise.rest_seconds}s</p>
                    <p className="text-xs text-muted-foreground italic">{exercise.notes}</p>
                  </div>
                ))}

                {/* Cool-down */}
                <div className="p-4 bg-card border border-border rounded-xl">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Cool-down
                  </p>
                  <p className="text-sm text-foreground">{todayWorkout.cool_down}</p>
                </div>
              </div>

              <Button
                onClick={() => {
                  setShowExerciseModal(false)
                  handleMarkComplete()
                }}
                className="w-full mt-6 bg-gradient-to-r from-primary to-[#00cc6a] text-black font-semibold rounded-xl"
              >
                Mark Complete ✅
              </Button>
            </div>
          </div>
        )}
      </>
    )
  }

  if (state === 'completed' && todayWorkout) {
    return (
      <Card className="bg-card border border-border rounded-2xl mb-6">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{cleanName(todayWorkout.day_name)}</h3>
              <p className="text-xs text-primary mt-1">Completed Today 🎉</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
