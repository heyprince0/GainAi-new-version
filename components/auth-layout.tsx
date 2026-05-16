'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AuthScreen } from './auth-screen'
import { ProfileSetup } from './profile-setup'
import { AiChat } from './ai-chat'
import { BottomNav } from './bottom-nav'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, profileLoading, hasProfile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const protectedRoutes = ['/dashboard', '/food-scanner', '/body-scanner']
  const authRoutes = ['/login', '/signup', '/']
  const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route))
  const isAuthRoute = authRoutes.includes(pathname ?? '')

  useEffect(() => {
    // Wait for auth to finish loading before doing anything
    if (loading) return

    if (!user && isProtectedRoute) {
      router.replace('/')
      return
    }

    if (user && isAuthRoute) {
      router.replace('/dashboard')
      return
    }
  }, [user, loading, pathname])

  // Show nothing while auth is loading — this prevents the flash
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-[#00ff88] border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
