'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from './supabase'
import type { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  loading: boolean
  profileLoading: boolean
  hasProfile: boolean
  intendedRoute: string | null
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  setIntendedRoute: (route: string | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasProfile, setHasProfile] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)
  const [intendedRoute, setIntendedRoute] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    // Get initial session first before anything renders
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    })

    // Listen for ALL auth state changes including TOKEN_REFRESHED and INITIAL_SESSION
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (mounted) {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setHasProfile(false)
  }

  const refreshProfile = async () => {
    if (!user) {
      setHasProfile(false)
      setProfileLoading(false)
      return
    }
    setProfileLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select()
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      setHasProfile(!!data)
    } catch (error) {
      console.error('Error checking profile:', error)
      setHasProfile(false)
    } finally {
      setProfileLoading(false)
    }
  }

  useEffect(() => {
    if (loading) return
    refreshProfile()
  }, [user, loading])

  return (
    <AuthContext.Provider value={{ user, loading, profileLoading, hasProfile, intendedRoute, signUp, signIn, signInWithGoogle, signOut, refreshProfile, setIntendedRoute }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

