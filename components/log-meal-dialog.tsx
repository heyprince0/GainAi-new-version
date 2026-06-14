'use client'

import { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { saveFuelScore } from '@/lib/fuel-score'

interface LogMealDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMealSaved: () => void
}

interface MealAnalysisResult {
  items: Array<{
    name: string
    quantity_label: string
    calories: number
    protein: number
    carbs: number
    fats: number
    fiber: number
  }>
  total: {
    calories: number
    protein: number
    carbs: number
    fats: number
    fiber: number
  }
  health_score: number
  health_rating: string
}

export function LogMealDialog({ open, onOpenChange, onMealSaved }: LogMealDialogProps) {
  const { user } = useAuth()
  const [state, setState] = useState<'input' | 'result'>('input')
  const [foodName, setFoodName] = useState('')
  const [quantity, setQuantity] = useState(100)
  const [unit, setUnit] = useState('grams (g)')
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<MealAnalysisResult | null>(null)
  const [saving, setSaving] = useState(false)

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#00ff88'
    if (score >= 6) return '#86efac'
    if (score >= 4) return '#facc15'
    if (score >= 2) return '#fb923c'
    return '#ef4444'
  }

  const normalizeScore = (score: number) => {
    if (!score) return 0
    let s = score > 10 ? score / 10 : score
    s = Math.min(Math.max(s, 0), 10)
    return Math.round(s)
  }

  const unitMap: { [key: string]: string } = {
    'grams (g)': 'g',
    'kilograms (kg)': 'kg',
    'milliliters (ml)': 'ml',
    'liters (L)': 'L',
    'pieces': 'pieces',
    'cups': 'cups',
    'bowls': 'bowls',
    'tablespoons': 'tbsp',
    'teaspoons': 'tsp',
  }

  const handleAnalyze = async () => {
    if (!foodName.trim()) {
      setError('Please enter a food item')
      return
    }

    setAnalyzing(true)
    setError(null)

    try {
      const unitShort = unitMap[unit]
      const response = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodName: foodName.trim(),
          quantity,
          unit: unitShort,
        }),
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to analyze meal')
      }

      setResult(data)
      setState('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze meal')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSave = async () => {
    if (!user || !result) return

    setSaving(true)
    try {
      const insertObj: any = {
        user_id: user.id,
        food_name: foodName.trim() || 'Logged Meal',
        calories: Number(result.total.calories) || 0,
        protein: Number(result.total.protein) || 0,
        carbs: Number(result.total.carbs) || 0,
        fats: Number(result.total.fats) || 0,
        fiber: Number(result.total.fiber) || 0,
        health_score: result.health_score !== undefined && result.health_score !== null
          ? Math.round(Number(result.health_score))
          : null,
        health_rating: result.health_rating || null,
      }

      const { error: insertError } = await supabase.from('food_scans').insert(insertObj)
      if (insertError) throw insertError

      // Fetch updated today's scans and save fuel score
      const istDateKey = (iso: string) =>
        new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Asia/Kolkata',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }).format(new Date(iso))

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

      const todayScans = todayData || []

      // Fetch user profile for goals
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, calorie_goal, protein_goal, carbs_goal, fat_goal')
        .eq('id', user.id)
        .single()

      if (profileData) {
        await saveFuelScore(user.id, profileData, todayScans)
      }

      // Reset and close
      resetForm()
      onOpenChange(false)
      onMealSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save meal')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setFoodName('')
    setQuantity(100)
    setUnit('grams (g)')
    setAnalyzing(false)
    setError(null)
    setResult(null)
    setState('input')
  }

  const handleLogAnother = () => {
    resetForm()
    setState('input')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md rounded-xl'>
        {state === 'input' ? (
          <>
            <DialogHeader>
              <DialogTitle>Log a Meal</DialogTitle>
            </DialogHeader>
            <div className='flex flex-col gap-4 py-4'>
              <div>
                <label className='mb-2 block text-sm font-medium text-foreground'>
                  Food Item
                </label>
                <input
                  type='text'
                  placeholder='e.g. Milk and Protein Shake'
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none'
                />
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div>
                  <label className='mb-2 block text-sm font-medium text-foreground'>
                    Quantity
                  </label>
                  <input
                    type='number'
                    min='1'
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none'
                  />
                </div>
                <div>
                  <label className='mb-2 block text-sm font-medium text-foreground'>
                    Unit
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none'
                  >
                    <option>grams (g)</option>
                    <option>kilograms (kg)</option>
                    <option>milliliters (ml)</option>
                    <option>liters (L)</option>
                    <option>pieces</option>
                    <option>cups</option>
                    <option>bowls</option>
                    <option>tablespoons</option>
                    <option>teaspoons</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className='rounded-lg border border-red-500/50 bg-red-500/5 p-3'>
                  <p className='text-xs text-red-600'>{error}</p>
                </div>
              )}
            </div>

            <DialogFooter className='flex gap-2'>
              <Button
                variant='outline'
                onClick={() => onOpenChange(false)}
                className='flex-1 rounded-lg'
              >
                Cancel
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={analyzing || !foodName.trim()}
                className='flex-1 rounded-lg bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold hover:opacity-90'
              >
                {analyzing ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Analyzing...
                  </>
                ) : (
                  'Analyze with AI'
                )}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Nutrition Breakdown</DialogTitle>
            </DialogHeader>
            <div className='flex flex-col gap-4 py-4 max-h-[60vh] overflow-y-auto'>
              {/* Individual Items */}
              {result?.items.map((item) => (
                <Card key={item.name} className='border-border/50'>
                  <CardContent className='p-4'>
                    <div className='mb-3'>
                      <p className='font-semibold text-foreground'>{item.name}</p>
                      <p className='text-xs text-muted-foreground'>{item.quantity_label}</p>
                    </div>
                    <div className='mb-3 text-sm'>
                      <p className='font-semibold text-foreground mb-1'>{item.calories} kcal</p>
                    </div>
                    <div className='space-y-2'>
                      <div>
                        <div className='mb-1 flex items-center justify-between text-xs'>
                          <span className='text-muted-foreground'>Protein</span>
                          <span className='font-semibold'>{item.protein}g</span>
                        </div>
                        <Progress value={Math.min((item.protein / 50) * 100, 100)} className='h-1.5' />
                      </div>
                      <div>
                        <div className='mb-1 flex items-center justify-between text-xs'>
                          <span className='text-muted-foreground'>Carbs</span>
                          <span className='font-semibold'>{item.carbs}g</span>
                        </div>
                        <Progress value={Math.min((item.carbs / 100) * 100, 100)} className='h-1.5' />
                      </div>
                      <div>
                        <div className='mb-1 flex items-center justify-between text-xs'>
                          <span className='text-muted-foreground'>Fats</span>
                          <span className='font-semibold'>{item.fats}g</span>
                        </div>
                        <Progress value={Math.min((item.fats / 50) * 100, 100)} className='h-1.5' />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Total Nutrition */}
              <Card className='border-primary/20 bg-primary/5'>
                <CardContent className='p-4'>
                  <p className='mb-3 text-sm font-semibold text-foreground'>Total Nutrition</p>
                  <div className='grid grid-cols-4 gap-2 text-center mb-4'>
                    <div>
                      <p className='text-lg font-bold text-primary'>{result?.total.calories}</p>
                      <p className='text-[10px] font-medium uppercase text-muted-foreground'>Cal</p>
                    </div>
                    <div>
                      <p className='text-lg font-bold'>{result?.total.protein}g</p>
                      <p className='text-[10px] font-medium uppercase text-muted-foreground'>Protein</p>
                    </div>
                    <div>
                      <p className='text-lg font-bold'>{result?.total.carbs}g</p>
                      <p className='text-[10px] font-medium uppercase text-muted-foreground'>Carbs</p>
                    </div>
                    <div>
                      <p className='text-lg font-bold'>{result?.total.fats}g</p>
                      <p className='text-[10px] font-medium uppercase text-muted-foreground'>Fats</p>
                    </div>
                  </div>

                  {result && (() => {
                    const score = normalizeScore(result.health_score)
                    const color = getScoreColor(score)
                    return (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '600' }}>Health Score</span>
                          <span style={{ color, fontSize: '12px', fontWeight: '600' }}>
                            {score}/10 — {result.health_rating}
                          </span>
                        </div>
                        <div style={{ width: '100%', height: '10px', background: '#e5e7eb', borderRadius: '8px' }}>
                          <div style={{ width: `${score * 10}%`, height: '100%', borderRadius: '8px', background: color, transition: 'width 0.3s ease' }} />
                        </div>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            </div>

            <DialogFooter className='flex gap-2'>
              <Button
                variant='outline'
                onClick={handleLogAnother}
                className='flex-1 rounded-lg'
              >
                Log Another
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className='flex-1 rounded-lg bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold hover:opacity-90'
              >
                {saving ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Saving...
                  </>
                ) : (
                  'Save to Dashboard'
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
