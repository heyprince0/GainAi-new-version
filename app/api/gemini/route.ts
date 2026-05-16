import { NextResponse } from "next/server"

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent"

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

  if (!apiKey) {
    return NextResponse.json(
      { error: { message: "Gemini API key is not configured" } },
      { status: 500 }
    )
  }

  let payload: any

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json(
      { error: { message: "Invalid JSON request body" } },
      { status: 400 }
    )
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json(
      { error: { message: "Request body must be a JSON object" } },
      { status: 400 }
    )
  }

  if (payload.generationConfig) {
    payload.generationConfig.maxOutputTokens = 4000
  } else {
    payload.generationConfig = { maxOutputTokens: 4000 }
  }

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const data = await response.json().catch(() => ({
    error: { message: "Gemini returned an invalid response" },
  }))

  return NextResponse.json(data, { status: response.status })
}
