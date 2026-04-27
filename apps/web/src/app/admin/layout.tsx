import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { JSX, ReactNode } from "react"

export default async function AdminLayout({ children }: { children: ReactNode }): Promise<JSX.Element> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") redirect("/app")

  const navItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/contacts", label: "Contacts" },
    { href: "/admin/contacts/import", label: "Import" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/opportunities", label: "Opportunities" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/billing", label: "Billing" },
    { href: "/admin/audit-logs", label: "Audit Logs" },
    { href: "/admin/settings", label: "Settings" },
  ]

  return (
    <div className="min-h-screen bg-navy-dark text-white flex">
      <aside className="w-56 bg-navy flex flex-col border-r border-navy-light">
        <div className="p-4 border-b border-navy-light">
          <span className="text-gold font-bold">Admin Panel</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-navy-light hover:text-white transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-navy-light">
          <Link href="/app" className="block px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">
            ← Back to App
          </Link>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
