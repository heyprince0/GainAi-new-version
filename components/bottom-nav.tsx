'use client'
import { LayoutDashboard, ScanLine, Activity } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

export function BottomNav() {
  const router = useRouter()
  const pathname = usePathname()
  const isActive = (path: string) => pathname === path

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      background: '#0f1318',
      borderTop: '1px solid #1a2028',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      height: '65px',
      paddingBottom: '8px',
      zIndex: 9999,
    }}>

      {/* Dashboard */}
      <button type="button"
        onClick={() => router.push('/dashboard')}
        style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '2px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: isActive('/dashboard') ? '#00ff88' : '#5a6672',
          fontSize: '11px', fontWeight: 500, width: '33%'
        }}>
        <LayoutDashboard size={22} />
        <span>Dashboard</span>
      </button>

      {/* Food Scanner - Center FAB */}
      <button type="button"
        onClick={() => router.push('/food-scanner')}
        style={{
          background: '#00ff88',
          borderRadius: '50%',
          width: '56px', height: '56px',
          marginBottom: '24px',
          boxShadow: '0 4px 20px rgba(0,255,136,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: 'none', cursor: 'pointer',
          flexShrink: 0
        }}>
        <ScanLine size={26} color="#000" />
      </button>

      {/* Body Scanner */}
      <button type="button"
        onClick={() => router.push('/body-scanner')}
        style={{
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '2px',
          background: 'none', border: 'none', cursor: 'pointer',
          color: isActive('/body-scanner') ? '#00ff88' : '#5a6672',
          fontSize: '11px', fontWeight: 500, width: '33%'
        }}>
        <Activity size={22} />
        <span>Body</span>
      </button>
    </nav>
  )
}
