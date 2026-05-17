"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Sun, Moon, Menu, X, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"

export function Navbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const authenticatedLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/food-scanner", label: "Food Scanner" },
    { href: "/body-scanner", label: "Body Scanner" },
    { href: "/download", label: "Download App" },
  ]

  const publicLinks = [
    { href: "/", label: "Home" },
    { href: "/food-scanner", label: "Food Scanner" },
    { href: "/body-scanner", label: "Body Scanner" },
    { href: "/download", label: "Download App" },
  ]

  const linksToShow = user ? authenticatedLinks : publicLinks

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <header className="top-navbar sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="GainAi Logo"
            width={40}
            height={40}
            className="h-10 w-10"
          />
          <span className="text-lg font-bold tracking-tight text-foreground">
            Gain<span className="text-primary">Ai</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {linksToShow.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-lg"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          )}
          {user ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="rounded-lg"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          ) : (
            <Link href="/">
              <Button
                className="rounded-lg bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold text-sm px-4"
              >
                Sign In
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="rounded-lg md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-border/50 bg-background px-4 pb-4 pt-2 md:hidden">
          {linksToShow.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
          {!user && (
            <Link href="/" onClick={() => setMobileOpen(false)}>
              <Button className="w-full mt-2 rounded-lg bg-gradient-to-r from-[#00ff88] to-[#00cc6a] text-black font-semibold">
                Sign In
              </Button>
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
