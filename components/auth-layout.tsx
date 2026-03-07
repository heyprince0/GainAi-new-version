'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AuthScreen } from './auth-screen'
import { ProfileSetup } from './profile-setup'
import { AiChat } from './ai-chat'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, hasProfile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [showAuthScreen, setShowAuthScreen] = useState(false)

  useEffect(() => {
    if (loading) return

    const isProtectedRoute = pathname.includes('food-scanner') || pathname.includes('body-scanner') || pathname.includes('dashboard')
    const isHomePage = pathname === '/'

    // Unauthenticated user trying to access protected route
    if (!user && isProtectedRoute) {
      setShowAuthScreen(true)
      return
    }

    // Authenticated user without profile setup
    if (user && !hasProfile && !isProtectedRoute) {
      setShowAuthScreen(false)
      return
    }

    // Authenticated user with profile on home page
    if (user && hasProfile && isHomePage) {
      router.push('/dashboard')
      return
    }

    // Home page for unauthenticated users is allowed
    if (!user && isHomePage) {
      setShowAuthScreen(false)
      return
    }

    setShowAuthScreen(false)
  }, [user, loading, hasProfile, pathname, router])

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

  // Show auth screen when user tries to access protected route without being logged in
  if (showAuthScreen) {
    return <AuthScreen />
  }

  // Show profile setup for authenticated users without profile
  if (user && !hasProfile) {
    return <ProfileSetup />
  }

  // Show main app content (home or protected pages)
  return (
    <>
      {children}
      {user && hasProfile && <AiChat />}
    </>
  )
}
