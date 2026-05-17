'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { 
  LayoutDashboard, Users, Settings, LogOut, Copy, QrCode, Download, 
  Plus, Trash2, Shield, Menu, X, Eye, EyeOff, Chrome
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

type AuthUser = { id: string; email?: string } | null

interface Gym {
  id: string
  owner_id: string
  name: string
  slug: string
  owner_name: string
  phone: string
  location: string
  is_active: boolean
}

interface GymMember {
  id: string
  gym_id: string
  user_id: string | null
  name: string
  phone: string
  is_active: boolean
  joined_at: string
}

type NavItem = 'dashboard' | 'members' | 'settings'

export default function GymAdminPage() {
  const router = useRouter()
  const [authUser, setAuthUser] = useState<AuthUser>(null)
  const [gym, setGym] = useState<Gym | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeNav, setActiveNav] = useState<NavItem>('dashboard')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Login/Signup states
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login')
  const [signupStep, setSignupStep] = useState(1)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')

  // Signup form states
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('+91')
  const [gymName, setGymName] = useState('')
  const [location, setLocation] = useState('')
  const [gymLogo, setGymLogo] = useState<string | null>(null)
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Members states
  const [members, setMembers] = useState<GymMember[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [addMemberOpen, setAddMemberOpen] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberPhone, setNewMemberPhone] = useState('+91')
  const [memberFormLoading, setMemberFormLoading] = useState(false)
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)
  const [bulkUploadLoading, setBulkUploadLoading] = useState(false)

  // Dashboard stats
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    blockedMembers: 0,
    thisWeek: 0,
    thisMonth: 0,
    scansThisWeek: 0,
  })
  const [statsLoading, setStatsLoading] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  // Check auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setAuthUser(session?.user ?? null)
    }
    checkAuth()
  }, [])

  // Fetch gym when user is set
  useEffect(() => {
    if (!authUser) {
      setLoading(false)
      return
    }

const fetchGym = async () => {
  try {
    const { data, error } = await supabase
      .from('gyms')
      .select('*')
      .eq('owner_id', authUser.id)
      .maybeSingle() // use maybeSingle instead of single — returns null if not found

    if (error) throw error
    setGym(data) // data will be null if no gym exists — that's fine
  } catch (error) {
    console.error('Error fetching gym:', error)
    setGym(null)
  } finally {
    setLoading(false)
  }
}
    fetchGym()
  }, [authUser])

  // Fetch members and stats when gym is loaded
  useEffect(() => {
    if (!gym) return

    const fetchData = async () => {
      await Promise.all([fetchMembers(), fetchStats()])
    }

    fetchData()
  }, [gym])

  const fetchMembers = async () => {
    if (!gym) return
    setMembersLoading(true)
    try {
      const { data, error } = await supabase
        .from('gym_members')
        .select('*')
        .eq('gym_id', gym.id)
        .order('joined_at', { ascending: false })

      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Failed to load members')
    } finally {
      setMembersLoading(false)
    }
  }

  const fetchStats = async () => {
    if (!gym) return
    setStatsLoading(true)
    try {
      const { data: allMembers, error } = await supabase
        .from('gym_members')
        .select('*')
        .eq('gym_id', gym.id)

      if (error) throw error

      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const thisWeek = allMembers?.filter(m => new Date(m.joined_at) > weekAgo).length || 0
      const thisMonth = allMembers?.filter(m => new Date(m.joined_at) > monthAgo).length || 0

      setStats({
        totalMembers: allMembers?.length || 0,
        activeMembers: allMembers?.filter(m => m.is_active).length || 0,
        blockedMembers: allMembers?.filter(m => !m.is_active).length || 0,
        thisWeek,
        thisMonth,
        scansThisWeek: 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substr(2, 4)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setAuthError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })
      if (error) throw error

      const { data: { user } } = await supabase.auth.getUser()
      setAuthUser(user)
    } catch (error: any) {
      setAuthError(error.message || 'Login failed')
      toast.error(error.message || 'Login failed')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setAuthLoading(true)
    setAuthError('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? window.location.origin + '/gym-admin' : undefined,
        },
      })
      if (error) throw error
    } catch (error: any) {
      setAuthError(error.message || 'Google sign-in failed')
      toast.error(error.message || 'Google sign-in failed')
      setAuthLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (signupStep === 1) {
      if (!fullName || !phone) {
        setAuthError('Please fill all fields')
        return
      }
      setSignupStep(2)
      setAuthError('')
    } else if (signupStep === 2) {
      if (!gymName || !location) {
        setAuthError('Please fill all fields')
        return
      }
      setSignupStep(3)
      setAuthError('')
    } else if (signupStep === 3) {
      if (!signupEmail || !signupPassword || !confirmPassword) {
        setAuthError('Please fill all fields')
        return
      }
      if (signupPassword !== confirmPassword) {
        setAuthError('Passwords do not match')
        return
      }

      setAuthLoading(true)
      try {
        const { data, error } = await supabase.auth.signUp({
          email: signupEmail,
          password: signupPassword,
          options: {
            data: {
              full_name: fullName,
              phone: phone,
            },
          },
        })

        if (error) throw error
        if (!data.user) throw new Error('Signup failed')

        // Create gym entry
        const slug = generateSlug(gymName)
        const { error: gymError } = await supabase.from('gyms').insert({
          owner_id: data.user.id,
          name: gymName,
          slug,
          owner_name: fullName,
          phone: phone,
          location: location,
          is_active: true,
        })

        if (gymError) throw gymError

        setAuthUser(data.user)
        toast.success('Gym account created successfully!')
      } catch (error: any) {
        setAuthError(error.message || 'Signup failed')
        toast.error(error.message || 'Signup failed')
      } finally {
        setAuthLoading(false)
      }
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      setAuthUser(null)
      setGym(null)
      setAuthTab('login')
      setSignupStep(1)
      toast.success('Logged out successfully')
    } catch (error: any) {
      toast.error(error.message || 'Logout failed')
    }
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gym || !newMemberName || !newMemberPhone) {
      toast.error('Please fill all fields')
      return
    }

    setMemberFormLoading(true)
    try {
      const { error } = await supabase.from('gym_members').insert({
        gym_id: gym.id,
        name: newMemberName,
        phone: newMemberPhone,
        is_active: true,
      })

      if (error) {
        if (error.message.includes('duplicate')) {
          toast.error('Phone number already exists in this gym')
        } else {
          throw error
        }
      } else {
        toast.success('Member added successfully')
        setNewMemberName('')
        setNewMemberPhone('+91')
        setAddMemberOpen(false)
        await fetchMembers()
        await fetchStats()
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add member')
    } finally {
      setMemberFormLoading(false)
    }
  }

  const handleToggleMemberStatus = async (memberId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('gym_members')
        .update({ is_active: !isActive })
        .eq('id', memberId)

      if (error) throw error

      toast.success(isActive ? 'Member blocked' : 'Member unblocked')
      await fetchMembers()
      await fetchStats()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update member')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('gym_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      toast.success('Member removed')
      await fetchMembers()
      await fetchStats()
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove member')
    }
  }

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!gym) return

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = async (event: any) => {
      const file = event.target.files?.[0]
      if (!file) return

      setBulkUploadLoading(true)
      try {
        const text = await file.text()
        const lines = text.split('\n').slice(1) // Skip header
        const members = lines
          .filter(line => line.trim())
          .map(line => {
            const [name, phone] = line.split(',').map(s => s.trim())
            return { name, phone }
          })

        let successCount = 0
        for (const member of members) {
          if (member.name && member.phone) {
            const { error } = await supabase.from('gym_members').insert({
              gym_id: gym.id,
              name: member.name,
              phone: member.phone.startsWith('+91') ? member.phone : `+91${member.phone}`,
              is_active: true,
            })
            if (!error) successCount++
          }
        }

        toast.success(`Uploaded ${successCount} members`)
        setBulkUploadOpen(false)
        await fetchMembers()
        await fetchStats()
      } catch (error: any) {
        toast.error(error.message || 'Upload failed')
      } finally {
        setBulkUploadLoading(false)
      }
    }
    input.click()
  }

  const copyInviteLink = () => {
    if (!gym) return
    const link = `https://gain-ai.vercel.app/join/${gym.slug}`
    navigator.clipboard.writeText(link)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
    toast.success('Link copied to clipboard')
  }

  const generateQRCode = () => {
    if (!gym) return
    const link = `https://gain-ai.vercel.app/join/${gym.slug}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`
    setQrCodeUrl(qrUrl)
  }

  const downloadQRCode = () => {
    if (!qrCodeUrl) return
    const a = document.createElement('a')
    a.href = qrCodeUrl
    a.download = `${gym?.slug}-qr-code.png`
    a.click()
  }

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.phone.includes(searchQuery)
  )

  // Not logged in state
  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Image
                src="/logo.png"
                alt="GainAi Logo"
                width={64}
                height={64}
                className="h-16 w-16"
              />
            </div>
            <CardTitle className="text-2xl">GainAi Gym Admin</CardTitle>
            <CardDescription>Manage your gym and members</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={authTab} onValueChange={(v) => { setAuthTab(v as 'login' | 'signup'); setAuthError(''); setSignupStep(1); }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={authLoading}
                  className="w-full border-2 border-foreground bg-background text-foreground hover:bg-muted rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <Chrome className="h-5 w-5" />
                  Continue with Google
                </Button>

                <div className="relative flex items-center gap-2">
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-xs text-muted-foreground px-2">Or</span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    disabled={authLoading}
                  />
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={authLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {authError && <p className="text-sm text-destructive">{authError}</p>}
                  <Button type="submit" className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold rounded-xl hover:opacity-90" disabled={authLoading}>
                    {authLoading ? 'Logging in...' : 'Login'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={authLoading}
                  className="w-full border-2 border-foreground bg-background text-foreground hover:bg-muted rounded-xl font-semibold flex items-center justify-center gap-2"
                >
                  <Chrome className="h-5 w-5" />
                  Continue with Google
                </Button>

                <div className="relative flex items-center gap-2">
                  <div className="flex-1 h-px bg-border"></div>
                  <span className="text-xs text-muted-foreground px-2">Or</span>
                  <div className="flex-1 h-px bg-border"></div>
                </div>

                <form onSubmit={handleSignup} className="space-y-4">
                  {signupStep === 1 && (
                    <>
                      <div>
                        <p className="text-sm font-semibold mb-2">Your Info</p>
                        <Input
                          placeholder="Full Name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          disabled={authLoading}
                        />
                      </div>
                      <Input
                        type="tel"
                        placeholder="Phone (starts with +91)"
                        value={phone}
                        onChange={(e) => {
                          let val = e.target.value
                          if (!val.startsWith('+91')) val = '+91'
                          setPhone(val)
                        }}
                        disabled={authLoading}
                      />
                      {authError && <p className="text-sm text-destructive">{authError}</p>}
                      <Button type="submit" className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold rounded-xl hover:opacity-90" disabled={authLoading}>
                        Next
                      </Button>
                    </>
                  )}

                  {signupStep === 2 && (
                    <>
                      <div>
                        <p className="text-sm font-semibold mb-2">Your Gym</p>
                        <Input
                          placeholder="Gym Name"
                          value={gymName}
                          onChange={(e) => setGymName(e.target.value)}
                          disabled={authLoading}
                        />
                      </div>
                      <Input
                        placeholder="City/Location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        disabled={authLoading}
                      />
                      <div>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            const input = document.createElement('input')
                            input.type = 'file'
                            input.accept = 'image/*'
                            input.onchange = (e: any) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                const reader = new FileReader()
                                reader.onload = (ev: any) => {
                                  setGymLogo(ev.target.result)
                                }
                                reader.readAsDataURL(file)
                              }
                            }
                            input.click()
                          }}
                        >
                          {gymLogo ? 'Logo Uploaded' : 'Upload Logo (Optional)'}
                        </Button>
                      </div>
                      {authError && <p className="text-sm text-destructive">{authError}</p>}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => setSignupStep(1)}
                          disabled={authLoading}
                        >
                          Back
                        </Button>
                        <Button type="submit" className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold rounded-xl hover:opacity-90" disabled={authLoading}>
                          Next
                        </Button>
                      </div>
                    </>
                  )}

                  {signupStep === 3 && (
                    <>
                      <div>
                        <p className="text-sm font-semibold mb-2">Create Password</p>
                        <Input
                          type="email"
                          placeholder="Email"
                          value={signupEmail}
                          onChange={(e) => setSignupEmail(e.target.value)}
                          disabled={authLoading}
                        />
                      </div>
                      <Input
                        type="password"
                        placeholder="Password"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        disabled={authLoading}
                      />
                      <Input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={authLoading}
                      />
                      {authError && <p className="text-sm text-destructive">{authError}</p>}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => setSignupStep(2)}
                          disabled={authLoading}
                        >
                          Back
                        </Button>
                        <Button type="submit" className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold rounded-xl hover:opacity-90" disabled={authLoading}>
                          {authLoading ? 'Creating...' : 'Create Gym Account'}
                        </Button>
                      </div>
                    </>
                  )}
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Loading state
  if (loading || !gym) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">Loading...</p>
        </div>
      </div>
    )
  }

  // Main dashboard layout
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-60 flex-col bg-[#0f1318] text-white border-r border-border">
        <div className="p-6 border-b border-border/20">
          <div className="flex items-center gap-3 mb-4">
            <Image
              src="/logo.png"
              alt="GainAi Logo"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <span className="font-bold text-lg">GainAi</span>
          </div>
          <p className="text-[#00ff88] font-semibold text-sm">{gym.name}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveNav('dashboard')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
              activeNav === 'dashboard' ? 'bg-[#00ff88] text-black' : 'text-white hover:bg-white/10'
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </button>
          <button
            onClick={() => setActiveNav('members')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
              activeNav === 'members' ? 'bg-[#00ff88] text-black' : 'text-white hover:bg-white/10'
            )}
          >
            <Users className="h-5 w-5" />
            Members
          </button>
          <button
            onClick={() => setActiveNav('settings')}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
              activeNav === 'settings' ? 'bg-[#00ff88] text-black' : 'text-white hover:bg-white/10'
            )}
          >
            <Settings className="h-5 w-5" />
            Settings
          </button>
        </nav>

        <div className="p-4 border-t border-border/20">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full gap-2 text-white border-white/20 hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden border-b border-border bg-background sticky top-0 z-40">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="GainAi Logo"
                width={32}
                height={32}
                className="h-8 w-8"
              />
              <div>
                <p className="font-bold text-sm">GainAi</p>
                <p className="text-[#00ff88] text-xs font-semibold">{gym.name}</p>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-accent rounded-lg"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="border-t border-border bg-background p-4 space-y-2">
              <button
                onClick={() => {
                  setActiveNav('dashboard')
                  setMobileMenuOpen(false)
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  activeNav === 'dashboard' ? 'bg-[#00ff88] text-black' : 'hover:bg-accent'
                )}
              >
                <LayoutDashboard className="h-5 w-5" />
                Dashboard
              </button>
              <button
                onClick={() => {
                  setActiveNav('members')
                  setMobileMenuOpen(false)
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  activeNav === 'members' ? 'bg-[#00ff88] text-black' : 'hover:bg-accent'
                )}
              >
                <Users className="h-5 w-5" />
                Members
              </button>
              <button
                onClick={() => {
                  setActiveNav('settings')
                  setMobileMenuOpen(false)
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                  activeNav === 'settings' ? 'bg-[#00ff88] text-black' : 'hover:bg-accent'
                )}
              >
                <Settings className="h-5 w-5" />
                Settings
              </button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full gap-2 mt-4"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 md:p-6">
            {/* Dashboard Section */}
            {activeNav === 'dashboard' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">Dashboard</h1>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Total Members</p>
                      <p className="text-3xl font-bold mt-2">{stats.totalMembers}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Active Members</p>
                      <p className="text-3xl font-bold text-[#00ff88] mt-2">{stats.activeMembers}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Blocked Members</p>
                      <p className="text-3xl font-bold text-destructive mt-2">{stats.blockedMembers}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="text-xl font-bold text-[#00ff88] mt-2">Active</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Invite and Quick Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-[#00ff88]" />
                        Invite Link
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={`https://gain-ai.vercel.app/join/${gym.slug}`}
                          className="text-sm"
                        />
                        <Button
                          onClick={copyInviteLink}
                          className="bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold rounded-xl hover:opacity-90"
                        >
                          <Copy className="h-4 w-4" />
                          {copiedLink ? 'Copied!' : 'Copy'}
                        </Button>
                      </div>

                      <Button
                        onClick={generateQRCode}
                        variant="outline"
                        className="w-full"
                      >
                        <QrCode className="h-4 w-4 mr-2" />
                        Generate QR Code
                      </Button>

                      {qrCodeUrl && (
                        <div className="space-y-3">
                          <div className="flex justify-center p-4 bg-background rounded-lg border">
                            <Image
                              src={qrCodeUrl}
                              alt="QR Code"
                              width={200}
                              height={200}
                            />
                          </div>
                          <Button
                            onClick={downloadQRCode}
                            className="w-full gap-2 bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold rounded-xl hover:opacity-90"
                          >
                            <Download className="h-4 w-4" />
                            Download QR Code
                          </Button>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">Your gym code: <span className="font-semibold text-foreground">{gym.slug}</span></p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Members joined this week</span>
                        <span className="font-bold text-[#00ff88] text-lg">{stats.thisWeek}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Members joined this month</span>
                        <span className="font-bold text-[#00ff88] text-lg">{stats.thisMonth}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total scans this week</span>
                        <span className="font-bold text-[#00ff88] text-lg">{stats.scansThisWeek}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Members */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Members</CardTitle>
                    <button
                      onClick={() => setActiveNav('members')}
                      className="text-[#00ff88] hover:underline text-sm font-semibold"
                    >
                      View All →
                    </button>
                  </CardHeader>
                  <CardContent>
                    {members.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No members yet. Share your invite link!</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Joined Date</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {members.slice(0, 5).map((member) => (
                              <TableRow key={member.id}>
                                <TableCell className="font-medium">{member.name}</TableCell>
                                <TableCell>{member.phone}</TableCell>
                                <TableCell className="text-sm">{new Date(member.joined_at).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <Badge variant={member.is_active ? 'default' : 'destructive'}>
                                    {member.is_active ? 'Active' : 'Blocked'}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Members Section */}
            {activeNav === 'members' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <h1 className="text-3xl font-bold">Members</h1>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex-1 sm:flex-none bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold rounded-xl hover:opacity-90">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Member</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddMember} className="space-y-4">
                          <Input
                            placeholder="Name"
                            value={newMemberName}
                            onChange={(e) => setNewMemberName(e.target.value)}
                          />
                          <Input
                            type="tel"
                            placeholder="Phone"
                            value={newMemberPhone}
                            onChange={(e) => {
                              let val = e.target.value
                              if (!val.startsWith('+91')) val = '+91'
                              setNewMemberPhone(val)
                            }}
                          />
                          <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold rounded-xl hover:opacity-90"
                            disabled={memberFormLoading}
                          >
                            {memberFormLoading ? 'Adding...' : 'Add Member'}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={bulkUploadOpen} onOpenChange={setBulkUploadOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="flex-1 sm:flex-none">
                          <Plus className="h-4 w-4 mr-2" />
                          Bulk Upload
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Bulk Upload Members</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                            <p className="font-semibold mb-2">CSV Format (with headers):</p>
                            <p className="font-mono text-xs">Name,Phone</p>
                            <p className="font-mono text-xs">John Doe,+919999999999</p>
                          </div>
                          <Button
                            onClick={handleBulkUpload}
                            className="w-full bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold rounded-xl hover:opacity-90"
                            disabled={bulkUploadLoading}
                          >
                            {bulkUploadLoading ? 'Uploading...' : 'Select CSV File'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                <Input
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />

                <Card>
                  <CardContent className="p-4">
                    {membersLoading ? (
                      <p className="text-center text-muted-foreground">Loading members...</p>
                    ) : filteredMembers.length === 0 ? (
                      <p className="text-center text-muted-foreground">No members found</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Joined Date</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredMembers.map((member) => (
                              <TableRow key={member.id}>
                                <TableCell className="font-medium">{member.name}</TableCell>
                                <TableCell>{member.phone}</TableCell>
                                <TableCell>
                                  <Badge variant={member.is_active ? 'default' : 'destructive'}>
                                    {member.is_active ? 'Active' : 'Blocked'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm">{new Date(member.joined_at).toLocaleDateString()}</TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      onClick={() => handleToggleMemberStatus(member.id, member.is_active)}
                                      variant="outline"
                                      size="sm"
                                      className={member.is_active ? 'text-destructive border-destructive' : 'text-[#00ff88] border-[#00ff88]'}
                                    >
                                      <Shield className="h-4 w-4" />
                                      {member.is_active ? 'Block' : 'Unblock'}
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="text-destructive border-destructive hover:bg-destructive/10"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogTitle>Remove Member</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to remove {member.name}? This action cannot be undone.
                                        </AlertDialogDescription>
                                        <div className="flex gap-2">
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="bg-destructive hover:bg-destructive/90"
                                          >
                                            Remove
                                          </AlertDialogAction>
                                        </div>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Settings Section */}
            {activeNav === 'settings' && (
              <div className="space-y-6 max-w-2xl">
                <h1 className="text-3xl font-bold">Settings</h1>

                <Card>
                  <CardHeader>
                    <CardTitle>Gym Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Gym Name</label>
                      <Input
                        value={gym.name}
                        readOnly
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Location</label>
                      <Input
                        value={gym.location}
                        readOnly
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Phone</label>
                      <Input
                        value={gym.phone}
                        readOnly
                        className="mt-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">To update gym details, contact support.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Subscription Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Current Plan</label>
                      <p className="mt-1 text-lg font-semibold text-[#00ff88]">Trial (Free)</p>
                    </div>
                    <Button className="bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold rounded-xl hover:opacity-90">
                      Contact Support to Upgrade
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                      className="w-full border-destructive text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
