"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, Camera, ScanLine, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

const API_KEY = "AIzaSyDHvGYDhy3ixuyPEqPR2oXYZF3GC7ellVk"

interface FoodResult {
  name: string
  calories: number
  protein: number
  carbs: number
  fats: number
  fiber: number
  servingSize: string
}

export function FoodScanner() {
  const { user } = useAuth()
  const [image, setImage] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [results, setResults] = useState<FoodResult[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (ev) => {
          setImage(ev.target?.result as string)
          setResults(null)
          setError(null)
        }
        reader.readAsDataURL(file)
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${API_KEY}`,
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
                    text: `Analyze this food image and provide detailed nutritional information. For each food item detected, respond with a JSON array containing objects with these fields: name (string), calories (number), protein (number), carbs (number), fats (number), fiber (number), servingSize (string). Be specific and accurate. Respond with ONLY a raw JSON array, no markdown, no code blocks, no explanation.`,
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
      const foodResults = Array.isArray(parsed) ? parsed : [parsed]
      setResults(foodResults)

      // Save to Supabase
      if (user && foodResults.length > 0) {
        const totalCalories = foodResults.reduce((sum, f) => sum + f.calories, 0)
        const totalProtein = foodResults.reduce((sum, f) => sum + f.protein, 0)
        const totalCarbs = foodResults.reduce((sum, f) => sum + f.carbs, 0)
        const totalFats = foodResults.reduce((sum, f) => sum + f.fats, 0)

        await supabase.from('food_scans').insert({
          user_id: user.id,
          foods: foodResults,
          total_calories: totalCalories,
          total_protein: totalProtein,
          total_carbs: totalCarbs,
          total_fats: totalFats,
          image_url: image,
        })
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to analyze food"
      setError(errorMsg)
      setResults(null)
    } finally {
      setScanning(false)
    }
  }, [image])

  const handleReset = useCallback(() => {
    setImage(null)
    setResults(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (cameraInputRef.current) cameraInputRef.current.value = ""
  }, [])

  const totalCalories = results
    ? results.reduce((acc, r) => acc + r.calories, 0)
    : 0
  const totalProtein = results
    ? results.reduce((acc, r) => acc + r.protein, 0)
    : 0
  const totalCarbs = results
    ? results.reduce((acc, r) => acc + r.carbs, 0)
    : 0
  const totalFats = results
    ? results.reduce((acc, r) => acc + r.fats, 0)
    : 0

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
                  <Camera className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">
                    Upload food photo
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    JPG, PNG up to 10MB
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
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    <Camera className="mr-2 h-3.5 w-3.5" />
                    Take Photo
                  </Button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleUpload}
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
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
          {image && !results && (
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

          {results && (
            <>
              {/* Summary */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-5">
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

              {/* Individual Items */}
              {results.map((food) => (
                <FoodResultCard key={food.name} food={food} />
              ))}

              <Button
                variant="outline"
                onClick={handleReset}
                className="rounded-xl"
              >
                Scan Another
              </Button>
            </>
          )}

          {!image && !results && (
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
