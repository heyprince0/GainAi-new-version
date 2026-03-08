'use client'

import { useAuth } from "@/lib/auth-context"
import { Navbar } from "@/components/navbar"
import { BodyScanner } from "@/components/body-scanner"

export default function BodyScannerPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-3" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Sign in required</h1>
          <p className="text-muted-foreground mb-6">Please sign in to access the Body Scanner</p>
          <a href="/" className="text-primary hover:underline font-medium">
            Go back to home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col pb-20">
      <Navbar />
      <main className="flex-1">
        <BodyScanner />
      </main>
    </div>
  )
}
