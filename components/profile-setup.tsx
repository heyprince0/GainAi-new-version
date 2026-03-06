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
  dailyCalories: number
  dailyProtein: number
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
    dailyCalories: 2000,
    dailyProtein: 150,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!user) throw new Error('User not authenticated')

      const { error: err } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: formData.fullName,
          age: formData.age,
          weight: formData.weight,
          height: formData.height,
          goal: formData.goal,
          daily_calories: formData.dailyCalories,
          daily_protein: formData.dailyProtein,
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

            <div className='grid grid-cols-2 gap-3'>
              <div>
                <label className='block text-sm font-medium text-foreground mb-1'>
                  Daily Calories
                </label>
                <input
                  type='number'
                  value={formData.dailyCalories}
                  onChange={(e) => setFormData({ ...formData, dailyCalories: parseInt(e.target.value) })}
                  className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm'
                  min='1000'
                  step='100'
                  required
                />
              </div>
              <div>
                <label className='block text-sm font-medium text-foreground mb-1'>
                  Daily Protein (g)
                </label>
                <input
                  type='number'
                  value={formData.dailyProtein}
                  onChange={(e) => setFormData({ ...formData, dailyProtein: parseInt(e.target.value) })}
                  className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm'
                  min='50'
                  step='10'
                  required
                />
              </div>
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
