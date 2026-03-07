'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface ProfileFormData {
  fullName: string
  age: number
  weight: number
  height: number
  goal: 'lose' | 'maintain' | 'gain'
}

export function ProfileSetup() {
  const { user, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: '',
    age: 25,
    weight: 70,
    height: 175,
    goal: 'maintain',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!user) throw new Error('User not authenticated')

      // first call the Gemini API (key stored in env as NEXT_PUBLIC_GEMINI_API_KEY)
      let calorie_goal = 0
      let protein_goal = 0

      try {
        const prompt = `
Based on this person's stats, calculate their daily calorie and protein goals:
- Age: ${formData.age}
- Weight: ${formData.weight}kg
- Height: ${formData.height}cm
- Fitness Goal: ${formData.goal}

Respond ONLY with this exact JSON, no markdown:
{
  "calorie_goal": <number>,
  "protein_goal": <number>
}
`
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.NEXT_PUBLIC_GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
          }
        )
        const data = await response.json()
        const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
        const clean = raw.replace(/```json|```/g, '').trim()
        const goals = JSON.parse(clean)
        calorie_goal = goals.calorie_goal
        protein_goal = goals.protein_goal
      } catch (aiErr) {
        console.error('Failed to fetch goals from Gemini', aiErr)
        // fallback to defaults if the AI call fails
        calorie_goal = 2000
        protein_goal = 150
      }

      const { error: err } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          name: formData.fullName,
          age: parseInt(formData.age.toString()),
          weight: parseFloat(formData.weight.toString()),
          height: parseFloat(formData.height.toString()),
          goal: formData.goal,
          calorie_goal,
          protein_goal,
        })

      if (err) throw err
      
      await refreshProfile()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to setup profile'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted p-4'>
      <Card className='w-full max-w-md border-border/50'>
        <CardHeader className='space-y-2 text-center'>
          <CardTitle className='text-2xl'>Complete Your Profile</CardTitle>
          <CardDescription>
            Help us personalize your fitness journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-foreground mb-1'>
                Full Name
              </label>
              <input
                type='text'
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder-muted-foreground focus:border-primary focus:outline-none'
                placeholder='Your name'
                required
              />
            </div>

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='block text-sm font-medium text-foreground mb-1'>
                  Age
                </label>
                <input
                  type='number'
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                  className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm'
                  min='13'
                  max='120'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-foreground mb-1'>
                  Weight (kg)
                </label>
                <input
                  type='number'
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) })}
                  className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm'
                  min='30'
                  step='0.1'
                  required
                />
              </div>
            </div>

            <div>
              <label className='block text-sm font-medium text-foreground mb-1'>
                Height (cm)
              </label>
              <input
                type='number'
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: parseFloat(e.target.value) })}
                className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm'
                min='100'
                max='250'
                step='0.1'
                required
              />
            </div>

            <div>
              <label className='block text-sm font-medium text-foreground mb-1'>
                Fitness Goal
              </label>
              <select
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value as any })}
                className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm'
                required
              >
                <option value='lose'>Lose Weight</option>
                <option value='maintain'>Maintain Weight</option>
                <option value='gain'>Gain Muscle</option>
              </select>
            </div>


            {error && (
              <div className='rounded-lg border border-red-500/50 bg-red-500/5 p-3'>
                <p className='text-sm text-red-600'>{error}</p>
              </div>
            )}

            <Button
              type='submit'
              disabled={loading}
              className='w-full rounded-lg'
            >
              {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {loading ? 'Setting up...' : 'Complete Setup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
