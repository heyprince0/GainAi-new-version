'use client'

import { useAuth } from '@/lib/auth-context'
import { AuthScreen } from './auth-screen'
import { ProfileSetup } from './profile-setup'
import { AiChat } from './ai-chat'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, hasProfile } = useAuth()

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
    return <AuthScreen />
  }

  if (!hasProfile) {
    return <ProfileSetup />
  }

  return (
    <>
      {children}
      <AiChat />
    </>
  )
}
