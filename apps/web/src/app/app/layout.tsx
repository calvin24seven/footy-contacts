import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { JSX, ReactNode } from "react"
import LogoutButton from "./LogoutButton"

export default async function AppLayout({ children }: { children: ReactNode }): Promise<JSX.Element> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-navy-dark text-white flex">
      {/* Sidebar */}
      <aside className="w-60 bg-navy flex flex-col shrink-0 border-r border-navy-light">
        <div className="p-5 border-b border-navy-light">
          <span className="text-lg font-bold text-gold">Footy Contacts</span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <NavItem href="/app" label="Search" />
          <NavItem href="/app/lists" label="My Lists" />
          <NavItem href="/app/exports" label="Exports" />
          <NavItem href="/app/opportunities" label="Opportunities" />
          <NavItem href="/app/billing" label="Billing" />
          <NavItem href="/app/profile" label="Profile" />
          <NavItem href="/app/settings" label="Settings" />
          {profile?.role === "admin" && (
            <NavItem href="/admin" label="Admin" gold />
          )}
        </nav>

        <div className="p-4 border-t border-navy-light">
          <div className="flex items-center gap-3">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-sm font-bold shrink-0">
                {profile?.full_name?.[0]?.toUpperCase() ?? "U"}
              </div>
            )}
            <span className="text-sm text-gray-300 truncate flex-1">
              {profile?.full_name ?? user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}

function NavItem({
  href,
  label,
  gold,
}: {
  href: string
  label: string
  gold?: boolean
}) {
  return (
    <Link
      href={href}
      className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-navy-light ${
        gold ? "text-gold" : "text-gray-300"
      }`}
    >
      {label}
    </Link>
  )
}
