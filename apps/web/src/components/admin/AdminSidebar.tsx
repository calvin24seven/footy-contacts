"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface NavItem {
  href: string
  label: string
  badge?: number
}

interface Props {
  navItems: NavItem[]
}

export default function AdminSidebar({ navItems }: Props) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close drawer on navigation
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Close drawer on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open])

  const sidebarContent = (
    <>
      <div className="p-4 border-b border-navy-light flex items-center justify-between">
        <span className="text-gold font-bold">Admin Panel</span>
        {/* Close button — mobile only */}
        <button
          onClick={() => setOpen(false)}
          className="lg:hidden text-gray-400 hover:text-white p-1 rounded"
          aria-label="Close menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-navy-light text-white"
                  : "text-gray-300 hover:bg-navy-light hover:text-white"
              }`}
            >
              <span>{item.label}</span>
              {item.badge != null && (
                <span className="ml-1 min-w-[1.25rem] px-1 py-0.5 rounded-full bg-gold text-navy text-[10px] font-bold text-center leading-none">
                  {item.badge > 999 ? "999+" : item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>
      <div className="p-3 border-t border-navy-light">
        <Link href="/app" className="block px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">
          ← Back to App
        </Link>
      </div>
    </>
  )

  return (
    <>
      {/* ── Desktop sidebar (always visible ≥lg) ── */}
      <aside className="hidden lg:flex w-56 bg-navy flex-col border-r border-navy-light shrink-0">
        {sidebarContent}
      </aside>

      {/* ── Mobile: hamburger trigger ── */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-30 bg-navy border border-navy-light rounded-lg p-2 text-gray-300 hover:text-white shadow-lg"
        aria-label="Open menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* ── Mobile: backdrop ── */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile: sliding drawer ── */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-navy flex flex-col border-r border-navy-light shadow-2xl transition-transform duration-200 ease-in-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
