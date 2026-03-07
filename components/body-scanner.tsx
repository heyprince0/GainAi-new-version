"use client"

import { useState, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Upload, Activity, X, Loader2, TrendingUp, TrendingDown, Minus, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/lib/auth-context"

const API_KEY = "AIzaSyDHvGYDhy3ixuyPEqPR2oXYZF3GC7ellVk"

interface BodyResult {
  body_fat: number
  bmi: number
  body_type: string
  body_type_description: string
  muscle: "Low" | "Average" | "Above Average" | "High"
  notes: string
  // keep old/extra fields optional in case the model still returns them
  bodyFatPercent?: number
  category?: string
  muscleMass?: string
  recommendations?: string[]
  composition?: {
    label: string
    value: number
    color: string
  }[]
}

export function BodyScanner() {
  const { user } = useAuth()
  const [image, setImage] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  const [results, setResults] = useState<BodyResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
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

  const handleAnalyze = useCallback(async () => {
    if (!image) return
    setScanning(true)
    setError(null)
    try {
      const base64Image = image.split(",")[1]
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${API_KEY}`,
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
                    text: `Analyze this body image and return ONLY this exact JSON with no markdown:
{
  "body_fat": <number>,
  "bmi": <number>,
  "body_type": "<one of these exact values only: Ectomorph, Mesomorph, Endomorph, Skinny, Athletic, Overweight, Obese, Fat>",
  "body_type_description": "<one line description>",
  "muscle": "<Low, Average, Above Average, High>",
  "notes": "<brief personalized advice>"
}
`
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
        throw new Error("No response from body analysis")
      }

      const rawText = data.candidates[0].content.parts[0].text
      const cleanText = rawText.replace(/```json|```/g, "").trim()
      const parsed = JSON.parse(cleanText)
      setResults(parsed)

      // results are available; saving deferred to button
      setSaved(false)
      setSaveMessage('')
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to analyze body"
      setError(errorMsg)
      setResults(null)
    } finally {
      setScanning(false)
    }
  }, [image])

  const router = useRouter()

  const handleSave = async () => {
    if (!user || !results) return
    setSaved(true)
    try {
      // log full result object for debugging
      console.log('Body scan result:', results)
      const now = new Date().toISOString()
      const insertObj: any = {
        user_id: user.id,
        body_fat: Number(results.body_fat ?? results.bodyFatPercent ?? 0) || 0,
        notes:
          results.notes || '' ,
        scanned_at: now,
      }

      const { error } = await supabase.from('body_scans').insert(insertObj)
      if (error) throw error
      setSaveMessage('✅ Saved to Dashboard!')
      router.refresh()
    } catch (err) {
      console.error(err)
      setSaveMessage('Failed to save')
      setSaved(false)
    }
  }

  const handleReset = useCallback(() => {
    setImage(null)
    setResults(null)
    setError(null)
    setSaved(false)
    setSaveMessage('')
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (cameraInputRef.current) cameraInputRef.current.value = ""
  }, [])

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 lg:px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Body Scanner
        </h1>
        <p className="mt-2 text-muted-foreground">
          Upload a full-body photo to get AI-powered body composition analysis.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Area */}
        <Card className="overflow-hidden border-border/50">
          <CardContent className="p-0">
            {!image ? (
              <div className="flex flex-col items-center justify-center gap-4 p-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Activity className="h-8 w-8" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">
                    Upload body photo
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Full-body photo for best results
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
                  capture="user"
                  className="sr-only"
                  onChange={handleUpload}
                />
              </div>
            ) : (
              <div className="relative">
                <img
                  src={image}
                  alt="Uploaded body photo"
                  className="aspect-[3/4] w-full object-cover"
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
              onClick={handleAnalyze}
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
                  <Activity className="mr-2 h-4 w-4" />
                  Analyze Body
                </>
              )}
            </Button>
          )}

          {scanning && (
            <Card className="border-border/50">
              <CardContent className="flex flex-col items-center gap-3 p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">
                  AI is analyzing your body composition...
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
              {/* Main Stats */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">
                      Body Analysis
                    </p>
                    {(() => {
                      const getBodyTypeColor = (type: string) => {
                        switch (type) {
                          case 'Athletic': return { bg: '#00ff88', text: '#000' }
                          case 'Mesomorph': return { bg: '#22c55e', text: '#000' }
                          case 'Ectomorph': return { bg: '#3b82f6', text: '#fff' }
                          case 'Skinny': return { bg: '#60a5fa', text: '#000' }
                          case 'Endomorph': return { bg: '#f97316', text: '#000' }
                          case 'Overweight': return { bg: '#fb923c', text: '#000' }
                          case 'Fat': return { bg: '#ef4444', text: '#fff' }
                          case 'Obese': return { bg: '#dc2626', text: '#fff' }
                          default: return { bg: '#6b7280', text: '#fff' }
                        }
                      }
                      const colors = getBodyTypeColor(results.body_type)
                      return (
                        <div style={{
                          display: 'inline-block',
                          padding: '4px 14px',
                          borderRadius: '20px',
                          fontSize: '13px',
                          fontWeight: '600',
                          background: colors.bg,
                          color: colors.text,
                          marginTop: '8px'
                        }}>
                          {results.body_type || 'Unknown'}
                        </div>
                      )
                    })()}
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">
                        {(results.body_fat ?? results.bodyFatPercent)}%
                      </p>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        Body Fat
                      </p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        {results.bmi}
                      </p>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        BMI
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {results.body_type}
                      </p>
                      <p className="text-[10px] leading-tight text-muted-foreground">
                        {results.body_type_description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Body Composition */}
              <Card className="border-border/50">
                <CardContent className="p-5">
                  <p className="mb-4 text-sm font-semibold text-foreground">
                    Body Composition
                  </p>

                  {/* Stacked bar */}
                  <div className="mb-4 flex h-6 overflow-hidden rounded-full">
                    {results.composition.map((item) => (
                      <div
                        key={item.label}
                        className={cn("transition-all", item.color)}
                        style={{ width: `${item.value}%` }}
                      />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {results.composition.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-2"
                      >
                        <div
                          className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            item.color
                          )}
                        />
                        <span className="text-xs text-muted-foreground">
                          {item.label}
                        </span>
                        <span className="ml-auto text-xs font-semibold text-foreground">
                          {item.value}%
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card className="border-border/50">
                <CardContent className="p-5">
                  <p className="mb-3 text-sm font-semibold text-foreground">
                    Areas to Improve
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {results.recommendations.map((rec, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 text-sm"
                      >
                        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          {i < 2 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : i === 2 ? (
                            <Minus className="h-3 w-3" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                        </div>
                        <p className="leading-relaxed text-muted-foreground">
                          {rec}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

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
                Scan Again
              </Button>
            </>
          )}

          {!image && !results && (
            <Card className="border-border/50">
              <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
                <Activity className="h-8 w-8 text-muted-foreground/50" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    No body scan yet
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    Upload a full-body photo for AI-powered composition analysis.
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
