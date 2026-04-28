"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface BottomNavProps {
  isAdmin: boolean
  fullName: string | null
  avatarUrl: string | null
  email: string | null
}

// ── Tab icons ──────────────────────────────────────────────────────────────────
function SearchIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 transition-colors ${active ? "text-gold" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}
function OppsIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 transition-colors ${active ? "text-gold" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  )
}
function ListsIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 transition-colors ${active ? "text-gold" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
  )
}
function MoreIcon() {
  return (
    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

const TABS = [
  { href: "/app", label: "Search", Icon: SearchIcon },
  { href: "/app/opportunities", label: "Opportunities", Icon: OppsIcon },
  { href: "/app/lists", label: "Lists", Icon: ListsIcon },
]

export default function BottomNav({ isAdmin, fullName, avatarUrl, email }: BottomNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const initials = fullName?.[0]?.toUpperCase() ?? email?.[0]?.toUpperCase() ?? "U"

  return (
    <>
      {/* ── Fixed bottom tab bar (mobile only) ───────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-navy border-t border-navy-light safe-area-bottom">
        <div className="flex items-stretch h-16">
          {TABS.map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== "/app" && pathname.startsWith(href))
            return (
              <Link key={href} href={href} className="flex-1 flex flex-col items-center justify-center gap-1 py-2">
                <Icon active={active} />
                <span className={`text-[10px] font-medium leading-none ${active ? "text-gold" : "text-gray-500"}`}>
                  {label}
                </span>
              </Link>
            )
          })}
          {/* More tab */}
          <button
            className="flex-1 flex flex-col items-center justify-center gap-1 py-2"
            onClick={() => setSheetOpen(true)}
          >
            <MoreIcon />
            <span className="text-[10px] font-medium text-gray-500 leading-none">More</span>
          </button>
        </div>
      </nav>

      {/* ── Bottom sheet overlay ─────────────────────────────────────────── */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ${sheetOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setSheetOpen(false)}
        />

        {/* Sheet */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-navy rounded-t-2xl shadow-2xl transform transition-transform duration-300 ease-out ${sheetOpen ? "translate-y-0" : "translate-y-full"}`}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-600 rounded-full" />
          </div>

          {/* Profile header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-navy-light">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="avatar" className="w-10 h-10 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{fullName ?? "User"}</p>
              <p className="text-gray-400 text-xs truncate">{email}</p>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-2">
            {[
              { href: "/app/profile", label: "My Profile", icon: <ProfileIcon /> },
              { href: "/app/exports", label: "Exports", icon: <ExportIcon /> },
              { href: "/app/billing", label: "Billing", icon: <BillingIcon /> },
              { href: "/app/settings", label: "Settings", icon: <SettingsIcon /> },
            ].map(({ href, label, icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setSheetOpen(false)}
                className="flex items-center gap-3.5 px-5 py-3.5 text-sm text-gray-300 hover:bg-navy-light active:bg-navy-light transition-colors"
              >
                <span className="w-5 h-5 text-gray-400 shrink-0">{icon}</span>
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setSheetOpen(false)}
                className="flex items-center gap-3.5 px-5 py-3.5 text-sm text-gold hover:bg-navy-light active:bg-navy-light transition-colors"
              >
                <span className="w-5 h-5 text-gold shrink-0"><AdminIcon /></span>
                Admin panel
              </Link>
            )}
            <div className="border-t border-navy-light my-1" />
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3.5 px-5 py-3.5 text-sm text-red-400 hover:bg-navy-light active:bg-navy-light transition-colors"
            >
              <span className="w-5 h-5 shrink-0"><SignOutIcon /></span>
              Sign out
            </button>
          </div>

          {/* iOS safe area spacer */}
          <div className="h-8" />
        </div>
      </div>
    </>
  )
}

// ── Sheet menu icons ───────────────────────────────────────────────────────────
function ProfileIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}
function ExportIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}
function BillingIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  )
}
function SettingsIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function AdminIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  )
}
function SignOutIcon() {
  return (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  )
}
