"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState, useRef, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import UnlocksWidget from "./UnlocksWidget"

interface TopNavProps {
  fullName: string | null
  avatarUrl: string | null
  email: string | null
  isAdmin: boolean
}

const NAV_LINKS = [
  { href: "/app", label: "Search" },
  { href: "/app/opportunities", label: "Opportunities" },
  { href: "/app/lists", label: "My Lists" },
]

export default function TopNav({ fullName, avatarUrl, email, isAdmin }: TopNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const initials = fullName?.[0]?.toUpperCase() ?? email?.[0]?.toUpperCase() ?? "U"

  return (
    <header className="bg-navy border-b border-navy-light shrink-0 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-14 gap-3 sm:gap-6">
        {/* Logo */}
        <Link href="/app" className="text-gold font-bold text-base shrink-0">
          Footy Contacts
        </Link>

        {/* Primary nav — desktop only (mobile uses BottomNav) */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || (href !== "/app" && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-navy-light text-white"
                    : "text-gray-400 hover:text-white hover:bg-navy-light"
                }`}
              >
                {label}
              </Link>
            )
          })}
          {isAdmin && (
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gold hover:bg-navy-light transition-colors ml-1"
            >
              Admin
            </Link>
          )}
        </nav>

        {/* Spacer — pushes right-side items to the edge on mobile */}
        <div className="flex-1 md:flex-none" />

        {/* Unlocks widget — all screen sizes */}
        <UnlocksWidget />

        {/* Profile dropdown — desktop only (mobile has BottomNav More sheet) */}
        <div className="relative hidden md:block" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-navy-light transition-colors"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-bold">
                {initials}
              </div>
            )}
            <span className="text-sm text-gray-300 max-w-[120px] truncate">
              {fullName ?? email}
            </span>
            <svg
              className={`w-3 h-3 text-gray-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-navy border border-navy-light rounded-xl shadow-xl z-50 py-1">
              <DropdownItem href="/app/profile" label="My Profile" onClick={() => setDropdownOpen(false)} />
              <DropdownItem href="/app/exports" label="Exports" onClick={() => setDropdownOpen(false)} />
              <DropdownItem href="/app/billing" label="Billing" onClick={() => setDropdownOpen(false)} />
              <DropdownItem href="/app/settings" label="Settings" onClick={() => setDropdownOpen(false)} />
              <div className="border-t border-navy-light my-1" />
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-navy-light hover:text-red-300 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function DropdownItem({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-2 text-sm text-gray-300 hover:bg-navy-light hover:text-white transition-colors"
    >
      {label}
    </Link>
  )
}
