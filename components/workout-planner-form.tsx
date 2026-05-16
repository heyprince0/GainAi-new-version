'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Loader2, X, ChevronLeft, ChevronRight, User } from 'lucide-react'

interface Props {
  userId: string
  existingBodyFat?: number
  onComplete: () => void
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

interface WorkoutPlan {
  plan_name: string
  goal_summary: string
  days: WorkoutDay[]
  rest_days: string[]
  tips: string[]
}

interface FormData {
  gender: 'male' | 'female' | 'other' | null
  bodyFatPercent: number | null
  fitnessGoal: string | null
  secondaryGoal: string | null
  experienceLevel: string | null
  daysPerWeek: number | null
  injuryInfo: string
  lifestyle: string | null
}

export function WorkoutPlannerForm({ userId, existingBodyFat, onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    gender: null,
    bodyFatPercent: existingBodyFat ?? null,
    fitnessGoal: null,
    secondaryGoal: null,
    experienceLevel: null,
    daysPerWeek: null,
    injuryInfo: '',
    lifestyle: null,
  })

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }

  const handleNext = () => {
    if (currentStep < 7) setCurrentStep(currentStep + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const handleGeneratePlan = async () => {
  setLoading(true)
  setError(null)

  try {
    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('name, age, weight, height')
      .eq('id', userId)
      .single()

    if (profileError) throw new Error('Failed to fetch profile')

    const { age, weight, height } = profile

    // Upsert workout_profiles
    const { error: upsertError } = await supabase
      .from('workout_profiles')
      .upsert(
        {
          user_id: userId,
          gender: formData.gender,
          body_fat_percent: formData.bodyFatPercent,
          fitness_goal: formData.fitnessGoal,
          secondary_goal: formData.secondaryGoal,
          experience_level: formData.experienceLevel,
          days_per_week: formData.daysPerWeek,
          injury_info: formData.injuryInfo || null,
          lifestyle: formData.lifestyle,
        },
        { onConflict: 'user_id' }
      )

    if (upsertError) throw new Error('Failed to save workout profile')

    // Build Gemini prompt
    const prompt = `You are an expert personal trainer. Create a weekly workout plan as JSON only. Return raw JSON with no markdown formatting and no code blocks.

User details: age ${age}, gender ${formData.gender}, weight ${weight}kg, height ${height}cm, body fat ${formData.bodyFatPercent}%, main goal: ${formData.fitnessGoal}, secondary goal: ${formData.secondaryGoal || 'none'}, experience: ${formData.experienceLevel}, training days per week: ${formData.daysPerWeek}, lifestyle: ${formData.lifestyle}, injuries or limitations: ${formData.injuryInfo || 'none'}.

Important scheduling rules:
- Spread workout days evenly across the week. Never put all rest days together at the end.
- For 3 days per week use: Monday, Wednesday, Friday. Rest on Tuesday, Thursday, Saturday, Sunday.
- For 4 days per week use: Monday, Tuesday, Thursday, Friday. Rest on Wednesday, Saturday, Sunday.
- For 5 days per week use: Monday, Tuesday, Wednesday, Friday, Saturday. Rest on Thursday, Sunday.
- For 6 days per week use: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday. Rest on Sunday only.
- Assign day_number strictly as: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday.
- Never assign two rest days between two workout days unnecessarily.
- The number of days in the "days" array must exactly match the days_per_week number the user selected. No more, no less.

Return exactly this JSON structure and nothing else:
{
  "plan_name": "string",
  "goal_summary": "string, maximum 2 sentences explaining the approach",
  "days": [
    {
      "day_number": 1,
      "day_name": "string e.g. Monday - Push Day",
      "focus": "string e.g. Chest, Shoulders, Triceps",
      "duration_minutes": number,
      "exercises": [
        {
          "name": "string",
          "sets": number,
          "reps": "string e.g. 8-12 or 45 seconds",
          "rest_seconds": number,
          "notes": "string, one short form tip"
        }
      ],
      "warm_up": "string, describe warm up in one sentence",
      "cool_down": "string, describe cool down in one sentence"
    }
  ],
  "rest_days": ["string e.g. Thursday - Rest and Recovery"],
  "tips": ["string", "string", "string"]
}`

    // Call Gemini API directly — only one clean call
    const response = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 4000 },
      }),
    })

    if (!response.ok) throw new Error('Failed to call Gemini API')

    const result = await response.json()

    if (!result.candidates || !result.candidates[0]) {
      throw new Error('Gemini returned empty response')
    }

    let rawText = result.candidates[0].content.parts[0].text

    // Clean any markdown fences
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim()

    // Extract only the JSON part safely
    const start = rawText.indexOf('{')
    const end = rawText.lastIndexOf('}')
    if (start === -1 || end === -1) throw new Error('Invalid JSON from Gemini')
    const cleanJson = rawText.substring(start, end + 1)

    const plan = JSON.parse(cleanJson) as WorkoutPlan

    // Insert workout plan
    const { data: planData, error: planError } = await supabase
      .from('workout_plans')
      .insert({ user_id: userId, plan })
      .select('id')
      .single()

    if (planError || !planData) throw new Error('Failed to save workout plan')

    const planId = planData.id

    // Create workout logs
    const today = new Date()
    const dayOfWeek = today.getDay()

    for (const day of plan.days) {
      const dayNumber = day.day_number
      const daysUntilTarget = ((dayNumber === 0 ? 7 : dayNumber) - dayOfWeek + 7) % 7
      const workoutDate = new Date(today)
      if (daysUntilTarget === 0 && dayOfWeek !== (dayNumber === 0 ? 7 : dayNumber)) {
        workoutDate.setDate(workoutDate.getDate() + 7)
      } else {
        workoutDate.setDate(workoutDate.getDate() + daysUntilTarget)
      }

      const dateStr = workoutDate.toISOString().split('T')[0]

      await supabase.from('workout_logs').insert({
        user_id: userId,
        plan_id: planId,
        workout_date: dateStr,
        day_name: day.day_name,
        completed: false,
      })
    }

    onComplete()

  } catch (err) {
    console.error('Error generating plan:', err)
    setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    setLoading(false)
  }
}

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-foreground font-semibold">AI is building your personalized plan...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 mb-4">
          <p className="text-destructive text-sm font-medium">{error}</p>
        </div>
        <Button
          onClick={() => {
            setError(null)
            setLoading(false)
          }}
          className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold"
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header with step title and progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">
            {getStepTitle(currentStep)}
          </h2>
          <p className="text-xs text-muted-foreground">Step {currentStep} of 7</p>
        </div>
        <Progress value={(currentStep / 7) * 100} className="h-2" />
      </div>

      {/* Step content */}
      <div className="mb-8">
        {currentStep === 1 && (
          <Step1Gender
            selected={formData.gender}
            onChange={(gender) => updateFormData({ gender })}
            bodyFatPercent={formData.bodyFatPercent}
            onBodyFatChange={(bodyFatPercent) => updateFormData({ bodyFatPercent })}
          />
        )}
        {currentStep === 2 && (
          <Step2Goal
            selected={formData.fitnessGoal}
            onChange={(fitnessGoal) => updateFormData({ fitnessGoal })}
          />
        )}
        {currentStep === 3 && (
          <Step3SecondaryGoal
            selected={formData.secondaryGoal}
            onChange={(secondaryGoal) => updateFormData({ secondaryGoal })}
            onSkip={() => handleNext()}
          />
        )}
        {currentStep === 4 && (
          <Step4Experience
            selected={formData.experienceLevel}
            onChange={(experienceLevel) => updateFormData({ experienceLevel })}
          />
        )}
        {currentStep === 5 && (
          <Step5WorkoutDays
            selected={formData.daysPerWeek}
            onChange={(daysPerWeek) => updateFormData({ daysPerWeek })}
          />
        )}
        {currentStep === 6 && (
          <Step6Injuries
            value={formData.injuryInfo}
            onChange={(injuryInfo) => updateFormData({ injuryInfo })}
            onSkip={() => handleNext()}
          />
        )}
        {currentStep === 7 && (
          <Step7Lifestyle
            selected={formData.lifestyle}
            onChange={(lifestyle) => updateFormData({ lifestyle })}
          />
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex gap-3">
        {currentStep > 1 && (
          <Button
            variant="outline"
            onClick={handleBack}
            className="flex-1 border-border bg-muted text-foreground hover:bg-muted/80"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        {currentStep < 7 ? (
          <Button
            onClick={handleNext}
            disabled={!isStepValid(currentStep, formData)}
            className="flex-1 bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleGeneratePlan}
            disabled={!isStepValid(7, formData)}
            className="flex-1 bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold disabled:opacity-50 py-3"
          >
            Generate My Workout Plan ✨
          </Button>
        )}
      </div>
    </div>
  )
}

function Step1Gender({
  selected,
  onChange,
  bodyFatPercent,
  onBodyFatChange,
}: {
  selected: string | null
  onChange: (gender: 'male' | 'female' | 'other') => void
  bodyFatPercent: number | null
  onBodyFatChange: (value: number | null) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">Gender</label>
        <div className="grid grid-cols-3 gap-3">
          {(['male', 'female', 'other'] as const).map((gender) => (
            <button
              key={gender}
              onClick={() => onChange(gender)}
              className={`p-4 rounded-xl border-2 font-semibold capitalize transition ${
                selected === gender
                  ? 'border-[#00ff88] text-foreground bg-[#00ff88]/10'
                  : 'border-border text-foreground bg-card hover:border-border/80'
              }`}
            >
              {gender}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Body Fat % <span className="text-muted-foreground">(optional)</span>
        </label>
        <input
          type="number"
          value={bodyFatPercent ?? ''}
          onChange={(e) => onBodyFatChange(e.target.value ? parseFloat(e.target.value) : null)}
          placeholder="e.g. 20"
          className="w-full px-4 py-2.5 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground"
        />
      </div>
    </div>
  )
}

function Step2Goal({
  selected,
  onChange,
}: {
  selected: string | null
  onChange: (goal: string) => void
}) {
  const goals = [
    { id: 'Fat Loss', emoji: '🔥', desc: 'Burn fat and get lean' },
    { id: 'Muscle Gain', emoji: '💪', desc: 'Build size and mass' },
    { id: 'Strength Building', emoji: '⚡', desc: 'Get stronger and powerful' },
    { id: 'Improve Cardio', emoji: '🏃', desc: 'Boost stamina and endurance' },
    { id: 'General Fitness', emoji: '⭐', desc: 'Stay healthy and active' },
  ]

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-3">Your Main Goal</label>
      <div className="grid grid-cols-1 gap-3">
        {goals.map(({ id, emoji, desc }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`p-4 rounded-xl border-2 text-left transition ${
              selected === id
                ? 'border-[#00ff88] bg-[#00ff88]/10'
                : 'border-border bg-card hover:border-border/80'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{emoji}</span>
              <div>
                <p className={`font-semibold ${selected === id ? 'text-foreground' : 'text-foreground'}`}>
                  {id}
                </p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function Step3SecondaryGoal({
  selected,
  onChange,
  onSkip,
}: {
  selected: string | null
  onChange: (goal: string) => void
  onSkip: () => void
}) {
  const goals = [
    { id: 'Six Pack', emoji: '🎯' },
    { id: 'Bigger Arms', emoji: '💪' },
    { id: 'Wider Shoulders', emoji: '🦅' },
    { id: 'Better Chest', emoji: '🏋️' },
    { id: 'Leg Strength', emoji: '🦵' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={onSkip}
          className="text-muted-foreground text-sm font-medium hover:text-foreground"
        >
          Skip →
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {goals.map(({ id, emoji }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`p-4 rounded-xl border-2 text-center transition ${
              selected === id
                ? 'border-[#00ff88] bg-[#00ff88]/10'
                : 'border-border bg-card hover:border-border/80'
            }`}
          >
            <p className="text-2xl mb-2">{emoji}</p>
            <p className={`text-sm font-semibold text-foreground`}>
              {id}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

function Step4Experience({
  selected,
  onChange,
}: {
  selected: string | null
  onChange: (level: string) => void
}) {
  const levels = [
    { id: 'Beginner', subtitle: 'Less than 6 months' },
    { id: 'Intermediate', subtitle: '6 months to 2 years' },
    { id: 'Advanced', subtitle: '2+ years of training' },
  ]

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-3">Your Experience</label>
      <div className="grid grid-cols-1 gap-3">
        {levels.map(({ id, subtitle }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`p-4 rounded-xl border-2 text-left transition ${
              selected === id
                ? 'border-[#00ff88] bg-[#00ff88]/10'
                : 'border-border bg-card hover:border-border/80'
            }`}
          >
            <p className={`font-semibold text-foreground`}>
              {id}
            </p>
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

function Step5WorkoutDays({
  selected,
  onChange,
}: {
  selected: number | null
  onChange: (days: number) => void
}) {
  const days = [3, 4, 5, 6]

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-3">
        How many days per week can you train?
      </label>
      <div className="grid grid-cols-4 gap-3">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => onChange(day)}
            className={`p-4 rounded-xl font-semibold transition flex flex-col items-center gap-1 ${
              selected === day
                ? 'bg-[#00ff88] text-black'
                : 'bg-card border border-border text-foreground hover:border-border/80'
            }`}
          >
            <span className="text-lg font-bold">{day}</span>
            <span className="text-xs">days</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Step6Injuries({
  value,
  onChange,
  onSkip,
}: {
  value: string
  onChange: (value: string) => void
  onSkip: () => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Any Injuries?</label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Describe any injuries or pain areas e.g. lower back pain, bad knees... (optional)"
          className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground resize-none"
          rows={4}
        />
      </div>
      <div className="flex justify-end">
        <button
          onClick={onSkip}
          className="text-muted-foreground text-sm font-medium hover:text-foreground"
        >
          Skip →
        </button>
      </div>
    </div>
  )
}

function Step7Lifestyle({
  selected,
  onChange,
}: {
  selected: string | null
  onChange: (lifestyle: string) => void
}) {
  const lifestyles = [
    { id: 'Desk Job', emoji: '🪑', subtitle: 'Sitting most of the day' },
    { id: 'Moderate Movement', emoji: '🚶', subtitle: 'Some walking daily' },
    { id: 'Physically Active', emoji: '⚒️', subtitle: 'Manual work or sports' },
    { id: 'Young Teen', emoji: '🎒', subtitle: 'School student, still growing' },
  ]

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-3">Your Lifestyle</label>
      <div className="grid grid-cols-1 gap-3">
        {lifestyles.map(({ id, emoji, subtitle }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`p-4 rounded-xl border-2 text-left transition ${
              selected === id
                ? 'border-[#00ff88] bg-[#00ff88]/10'
                : 'border-border bg-card hover:border-border/80'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{emoji}</span>
              <div>
                <p className={`font-semibold text-foreground`}>
                  {id}
                </p>
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function getStepTitle(step: number): string {
  const titles: Record<number, string> = {
    1: 'Your Body',
    2: 'Your Main Goal',
    3: 'Secondary Goal (Optional)',
    4: 'Your Experience',
    5: 'Workout Days',
    6: 'Any Injuries?',
    7: 'Your Lifestyle',
  }
  return titles[step] || ''
}

function isStepValid(step: number, formData: FormData): boolean {
  switch (step) {
    case 1:
      return formData.gender !== null
    case 2:
      return formData.fitnessGoal !== null
    case 3:
      return true // Optional step
    case 4:
      return formData.experienceLevel !== null
    case 5:
      return formData.daysPerWeek !== null
    case 6:
      return true // Optional step
    case 7:
      return formData.lifestyle !== null
    default:
      return false
  }
}
