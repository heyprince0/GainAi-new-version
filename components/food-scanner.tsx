"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Upload, Camera, ScanLine, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { processImageFile } from "@/lib/image"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

interface FoodResult {
  name: string
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber: number
  servingSize: string
}

interface MealAnalysis {
  meal_name: string
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fats: number
  total_fiber?: number
  health_score?: number
  health_rating?: string
  ai_note?: string
  items: FoodResult[]
}

export function FoodScanner() {
  const { user } = useAuth()
  const [image, setImage] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [analysis, setAnalysis] = useState<MealAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [preparing, setPreparing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target
      const file = input.files?.[0]
      if (!file) {
        input.value = ""
        return
      }
      setError(null)
      setAnalysis(null)
      setPreparing(true)
      try {
        const dataUrl = await processImageFile(file)
        setImage(dataUrl)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load the image")
      } finally {
        setPreparing(false)
        input.value = ""
      }
    },
    []
  )

  const handleScan = useCallback(async () => {
    if (!image) return
    setScanning(true)
    setError(null)
    try {
      const base64Image = image.split(",")[1]
      const response = await fetch(
        "/api/gemini",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: "image/jpeg",
                      data: base64Image,
                    },
                  },
                  {
                    text: `Analyze this food image and return ONLY this exact JSON with no markdown:
{
  "meal_name": "<single descriptive meal name>",
  "total_calories": <number>,
  "total_protein": <number>,
  "total_carbs": <number>,
  "total_fats": <number>,
  "total_fiber": <number>,
  "health_score": <whole number between 1 and 10, NO decimals>,
  "health_rating": "<Excellent, Good, Average, Poor, Very Poor>",
  "ai_note": "<2-3 sentences about this food from a fitness/gym perspective — is it good for muscle building, fat loss, etc. Be specific and helpful>",
  "items": [
    {
      "food_name": "<item name>",
      "serving_size": "<amount>",
      "calories": <number>,
      "protein": <number>,
      "carbs": <number>,
      "fats": <number>
    }
  ]
}

Health score rules for gym/fitness people (1–10 whole numbers):
- 9-10: Excellent (high protein, complex carbs, low fat)
- 7-8: Good
- 5-6: Average
- 3-4: Poor (junk food, high fat, low protein)
- 1-2: Very Poor
`, 
                  },
                ],
              },
            ],
          }),
        }
      )

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message)
      }

      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("No response from food analysis")
      }

      const rawText = data.candidates[0].content.parts[0].text
      const cleanText = rawText.replace(/```json|```/g, "").trim()
      const parsed = JSON.parse(cleanText)

      // normalize into MealAnalysis
      let meal: MealAnalysis
      if (Array.isArray(parsed)) {
        const items: FoodResult[] = parsed.map((p: any) => ({
          name: p.name,
          calories: p.calories,
          protein: p.protein,
          carbs: p.carbs,
          fats: p.fats,
          fiber: p.fiber || 0,
          servingSize: p.servingSize || '',
        }))
        meal = {
          meal_name: items.length === 1 ? items[0].name : 'Mixed Meal',
          total_calories: items.reduce((acc, r) => acc + (r.calories || 0), 0),
          total_protein: items.reduce((acc, r) => acc + (r.protein || 0), 0),
          total_carbs: items.reduce((acc, r) => acc + (r.carbs || 0), 0),
          total_fats: items.reduce((acc, r) => acc + (r.fats || 0), 0),
          total_fiber: items.reduce((acc, r) => acc + (r.fiber || 0), 0),
          health_score: 0,
          health_rating: '',
          ai_note: '',
          items,
        }
      } else {
        meal = {
          meal_name: parsed.meal_name || 'Mixed Meal',
          total_calories: parsed.total_calories || 0,
          total_protein: parsed.total_protein || 0,
          total_carbs: parsed.total_carbs || 0,
          total_fats: parsed.total_fats || 0,
          total_fiber: parsed.total_fiber || 0,
          health_score: parsed.health_score ?? 0,
          health_rating: parsed.health_rating || '',
          ai_note: parsed.ai_note || '',
          items: Array.isArray(parsed.items)
            ? parsed.items.map((p: any) => ({
                name: p.food_name || p.name,
                calories: p.calories,
                protein: p.protein,
                carbs: p.carbs,
                fats: p.fats,
                fiber: 0,
                servingSize: p.serving_size || '',
              }))
            : [],
        }
      }

      setAnalysis(meal)
      // results are set, saving happens via button instead of automatically
      setSaved(false)
      setSaveMessage('')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to analyze food"
      setError(errorMsg)
      setAnalysis(null)
    } finally {
      setScanning(false)
    }
  }, [image])

  const handleReset = useCallback(() => {
    setImage(null)
    setAnalysis(null)
    setError(null)
    setSaved(false)
    setSaveMessage('')
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  const totalCalories = analysis?.total_calories ?? 0
  const totalProtein = analysis?.total_protein ?? 0
  const totalCarbs = analysis?.total_carbs ?? 0
  const totalFats = analysis?.total_fats ?? 0

  const router = useRouter()

  const handleSave = async () => {
    if (!user || !analysis) return
    setSaved(true)
    try {
      console.log("Meal analysis:", analysis)
      const now = new Date().toISOString()
      const insertObj: any = {
        user_id: user.id,
        food_name: analysis.meal_name || 'Mixed Meal',
        calories: Number(analysis.total_calories) || 0,
        protein: Number(analysis.total_protein) || 0,
        carbs: Number(analysis.total_carbs) || 0,
        fats: Number(analysis.total_fats) || 0,
        fiber: Number(analysis.total_fiber) || 0,
        // round to whole number before saving (ensure column can hold integers)
        health_score: analysis.health_score !== undefined && analysis.health_score !== null
          ? Math.round(Number(analysis.health_score))
          : null,
        health_rating: analysis.health_rating || null,
      }

      const { error } = await supabase.from('food_scans').insert(insertObj)
      if (error) throw error
      setSaveMessage('✅ Saved to Dashboard!')
      router.refresh()
    } catch (err) {
      setSaveMessage('Failed to save')
      setSaved(false)
      console.error(err)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Food Scanner
        </h1>
        <p className="mt-2 text-muted-foreground">
          Upload a photo of your meal to get instant nutritional analysis.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Area */}
        <Card className="overflow-hidden border-border/50">
          <CardContent className="p-0">
            {!image ? (
              <div className="flex flex-col items-center justify-center gap-4 p-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  {preparing ? <Loader2 className="h-8 w-8 animate-spin" /> : <Camera className="h-8 w-8" />}
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">
                    {preparing ? "Preparing your photo..." : "Upload food photo"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {preparing ? "This takes a couple of seconds for big photos" : "JPG, PNG up to 10MB"}
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-3.5 w-3.5" />
                    Upload Image
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-lg"
                    asChild
                  >
                    <label className="cursor-pointer">
                      <Camera className="mr-2 h-3.5 w-3.5" />
                      Take Photo
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          setError(null)
                          setAnalysis(null)
                          setPreparing(true)
                          processImageFile(file)
                            .then((dataUrl) => setImage(dataUrl))
                            .catch((err) => setError(err instanceof Error ? err.message : "Could not load the image"))
                            .finally(() => setPreparing(false))
                        }}
                      />
                    </label>
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleUpload}
                />
              </div>
            ) : (
              <div className="relative">
                <img
                  src={image}
                  alt="Uploaded food"
                  className="aspect-square w-full object-cover"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-3 top-3 rounded-full bg-background/80 backdrop-blur-sm"
                  onClick={handleReset}
                  aria-label="Remove image"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results / Action */}
        <div className="flex flex-col gap-4">
          {image && !analysis && (
            <Button
              onClick={handleScan}
              disabled={scanning}
              size="lg"
              className="rounded-xl text-base font-semibold shadow-lg shadow-primary/25"
            >
              {scanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <ScanLine className="mr-2 h-4 w-4" />
                  Scan Food
                </>
              )}
            </Button>
          )}

          {scanning && (
            <Card className="border-border/50">
              <CardContent className="flex flex-col items-center gap-3 p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">
                  AI is analyzing your meal...
                </p>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-red-500/50 bg-red-500/5">
              <CardContent className="p-4">
                <p className="text-sm text-red-600">Error: {error}</p>
              </CardContent>
            </Card>
          )}

          {analysis && (
            <>
              {/* Summary */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-5">
                  {analysis?.meal_name && (
                    <p className="mb-1 text-lg font-semibold text-foreground">
                      {analysis.meal_name}
                    </p>
                  )}
                  <p className="mb-3 text-sm font-semibold text-foreground">
                    Total Nutrition
                  </p>
                  <div className="grid grid-cols-4 gap-3 text-center">
                    <div>
                      <p className="text-xl font-bold text-primary">{totalCalories}</p>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        Calories
                      </p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground">{totalProtein}g</p>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        Protein
                      </p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground">{totalCarbs}g</p>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        Carbs
                      </p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-foreground">{totalFats}g</p>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        Fats
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Health Score Section */}
              {analysis && (() => {
                // convert any old 0-100 responses down to 0-10 and clamp
                const raw = analysis.health_score ?? 0
                const normalized = raw > 10 ? raw / 10 : raw
                const score = Math.min(Math.max(normalized, 0), 10)
                const scoreColor = score >= 8 ? '#00ff88' :
                                   score >= 6 ? '#86efac' :
                                   score >= 4 ? '#facc15' :
                                   score >= 2 ? '#fb923c' : '#ef4444'
                return (
                  <div style={{
                    marginTop: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '600' }}>Health Score</span>
                      <span style={{ color: scoreColor }}>
                        {Math.round(score)}/10 — {analysis.health_rating}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '12px', background: '#e5e7eb', borderRadius: '10px' }}>
                      <div style={{ width: `${score * 10}%`, height: '100%', borderRadius: '10px', background: scoreColor, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                )
              })()}

              {/* Individual Items */}
              {analysis?.items.map((food) => (
                <FoodResultCard key={food.name} food={food} />
              ))}

              {saveMessage && (
                <p className="text-sm text-green-600">{saveMessage}</p>
              )}
              {!saved && (
                <Button
                  variant="outline"
                  className="rounded-xl bg-green-100 text-green-800"
                  onClick={handleSave}
                >
                  Save to Dashboard
                </Button>
              )}
              {saved && (
                <Button
                  variant="outline"
                  disabled
                  className="rounded-xl"
                >
                  Saved ✅
                </Button>
              )}
              <Button
                variant="outline"
                onClick={handleReset}
                className="rounded-xl"
              >
                Scan Another
              </Button>
            </>
          )}

          {!image && !analysis && (
            <Card className="border-border/50">
              <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                <ScanLine className="h-8 w-8 text-muted-foreground/50" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    No food scanned yet
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Upload a photo to get started with your nutritional analysis.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function FoodResultCard({ food }: { food: FoodResult }) {
  const maxMacro = Math.max(food.protein, food.carbs, food.fats, 1)

  return (
    <Card className="border-border/50">
      <CardContent className="p-5">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">{food.name}</h3>
          <span className="text-xs text-muted-foreground">{food.servingSize}</span>
        </div>
        <p className="mb-4 text-lg font-bold text-primary">
          {food.calories} <span className="text-xs font-normal text-muted-foreground">kcal</span>
        </p>

        <div className="flex flex-col gap-3">
          <MacroBar
            label="Protein"
            value={food.protein}
            max={maxMacro}
            unit="g"
          />
          <MacroBar
            label="Carbs"
            value={food.carbs}
            max={maxMacro}
            unit="g"
          />
          <MacroBar
            label="Fats"
            value={food.fats}
            max={maxMacro}
            unit="g"
          />
        </div>
      </CardContent>
    </Card>
  )
}

function MacroBar({
  label,
  value,
  max,
  unit,
}: {
  label: string
  value: number
  max: number
  unit: string
}) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="w-14 text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <Progress value={percent} className="h-2 flex-1" />
      <span className="w-10 text-right text-xs font-semibold text-foreground">
        {value}
        {unit}
      </span>
    </div>
  )
}
