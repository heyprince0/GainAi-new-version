import { NextResponse } from "next/server"

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000) // 30s timeout per attempt

    try {
      const response = await fetch(url, { ...options, signal: controller.signal })
      clearTimeout(timeout)

      // Retry on 429 (rate limit) or 503 (overloaded)
      if ((response.status === 429 || response.status === 503) && i < retries - 1) {
        const delay = Math.pow(2, i) * 1000 // 1s → 2s → 4s
        await new Promise((r) => setTimeout(r, delay))
        continue
      }

      return response
    } catch {
      clearTimeout(timeout)
      if (i === retries - 1) throw new Error("Request timed out or failed")
      await new Promise((r) => setTimeout(r, Math.pow(2, i) * 1000))
    }
  }
  throw new Error("Max retries reached")
}

export async function POST(request: Request) {
  // ✅ ONLY use server-side key — never NEXT_PUBLIC_ for secrets
  const apiKey = process.env.GEMINI_API_KEY

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

  payload.generationConfig = {
    ...(payload.generationConfig || {}),
    maxOutputTokens: 12000,
  }

  try {
    const response = await fetchWithRetry(
      `${GEMINI_ENDPOINT}?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    )

    const data = await response.json().catch(() => ({
      error: { message: "Gemini returned an invalid response" },
    }))

    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json(
      { error: { message: "Request failed after retries. Please try again." } },
      { status: 503 }
    )
  }
}
