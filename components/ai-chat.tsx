"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { MessageCircle, X, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

const initialMessages: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Hey there! I'm your GainAi Coach. Ask me anything about nutrition, workouts, or body composition. How can I help you today?",
  },
]

const coachResponses = [
  "Great question! For optimal muscle growth, aim for 1.6-2.2g of protein per kg of body weight daily. Spread this across 4-5 meals for best absorption.",
  "I'd recommend focusing on compound movements like squats, deadlifts, and bench press. These recruit the most muscle fibers and give you the best bang for your buck.",
  "For fat loss while preserving muscle, aim for a moderate calorie deficit of 300-500 calories below maintenance. Keep protein high and include resistance training 3-4 times per week.",
  "Recovery is just as important as training! Aim for 7-9 hours of sleep and make sure you're eating enough to support your training intensity.",
  "Hydration is key! Aim for about 35ml per kg of body weight daily, and add an extra 500ml for every hour of exercise.",
]

export function AiChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: "You are GainAi Coach, an expert fitness and nutrition AI assistant. You provide personalized advice on workouts, nutrition, body composition, and fitness goals. Be encouraging, knowledgeable, and practical in your responses. Keep responses concise (2-3 sentences) and actionable.",
                },
              ],
            },
            contents: messages
              .concat(userMsg)
              .map((msg) => ({
                role: msg.role === "assistant" ? "model" : "user",
                parts: [{ text: msg.content }],
              })),
          }),
        }
      )

      const data = await response.json()

      if (data.error) {
        console.error("[v0] API Error:", data.error.message)
        throw new Error(data.error.message)
      }

      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        throw new Error("No response from AI")
      }

      const aiResponse = data.candidates[0].content.parts[0].text
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (error) {
      console.error("Error fetching AI response:", error)
      const fallback: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          coachResponses[Math.floor(Math.random() * coachResponses.length)],
      }
      setMessages((prev) => [...prev, fallback])
    } finally {
      setLoading(false)
    }
  }, [input, loading, messages])

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95",
          open && "rotate-0"
        )}
        aria-label={open ? "Close chat" : "Open AI coach chat"}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageCircle className="h-5 w-5" />
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[480px] w-[360px] flex-col overflow-hidden rounded-2xl border border-border/50 bg-background shadow-2xl sm:w-[380px]">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border/50 bg-card px-4 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
              <span className="text-xs font-bold text-primary-foreground">
                G
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                GainAi Coach
              </p>
              <p className="text-[10px] text-muted-foreground">
                AI Fitness Assistant
              </p>
            </div>
            <div className="ml-auto flex h-2 w-2 rounded-full bg-primary" />
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-4 py-3">
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
                    <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-border/50 bg-card p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your AI coach..."
                className="flex-1 rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || loading}
                className="h-10 w-10 shrink-0 rounded-xl"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
