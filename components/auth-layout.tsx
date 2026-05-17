'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const protectedRoutes = ['/dashboard', '/food-scanner', '/body-scanner']
  const authRoutes = ['/']
  const isProtectedRoute = protectedRoutes.some(route => pathname?.startsWith(route))
  const isAuthRoute = authRoutes.includes(pathname ?? '')

  useEffect(() => {
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
