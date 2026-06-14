import { NextResponse } from "next/server"

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key is not configured" },
      { status: 500 }
    )
  }

  let body: any

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body" },
      { status: 400 }
    )
  }

  const { foodName, quantity, unit } = body

  if (!foodName || quantity === undefined || !unit) {
    return NextResponse.json(
      { error: "Missing required fields: foodName, quantity, unit" },
      { status: 400 }
    )
  }

  const systemPrompt = `You are a nutrition analysis AI. The user has logged a food item and you must analyze it and return ONLY valid JSON with no markdown.`

  const userPrompt = `The user logged: ${quantity} ${unit} of "${foodName}". If this describes multiple food items (e.g. "milk and protein powder"), split it into separate items. For each item, estimate calories, protein (g), carbs (g), fats (g), and fiber (g) based on the given quantity and unit. Also return a combined total across all items, a health_score from 0-10, and a health_rating of one of: Poor, Average, Good, Excellent. Respond with ONLY valid JSON in this exact shape:
{ "items": [{ "name": string, "quantity_label": string, "calories": number, "protein": number, "carbs": number, "fats": number, "fiber": number }], "total": { "calories": number, "protein": number, "carbs": number, "fats": number, "fiber": number }, "health_score": number, "health_rating": string }`

  try {
    const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: userPrompt,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 12000,
        },
      }),
    })

    const data = await response.json()

    if (data.error) {
      console.error("Gemini error:", data.error)
      return NextResponse.json(
        { error: data.error.message || "AI analysis failed" },
        { status: 400 }
      )
    }

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return NextResponse.json(
        { error: "No response from nutrition analysis" },
        { status: 400 }
      )
    }

    const rawText = data.candidates[0].content.parts[0].text
    const cleanText = rawText.replace(/```json|```/g, "").trim()

    let parsed: any
    try {
      parsed = JSON.parse(cleanText)
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Raw text:", rawText)
      return NextResponse.json(
        { error: "Failed to parse nutrition data" },
        { status: 400 }
      )
    }

    // Validate structure
    if (!parsed.items || !Array.isArray(parsed.items) || !parsed.total) {
      return NextResponse.json(
        { error: "Invalid response structure from AI" },
        { status: 400 }
      )
    }

    return NextResponse.json(parsed)
  } catch (err) {
    console.error("API error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to analyze meal" },
      { status: 500 }
    )
  }
}
