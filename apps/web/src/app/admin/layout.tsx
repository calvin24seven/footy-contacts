import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import type { JSX, ReactNode } from "react"
import AdminSidebar from "@/components/admin/AdminSidebar"

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

  // Pending change-signal count for badge
  const adminClient = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: pendingChanges } = await (adminClient.from("contact_role_history") as any)
    .select("id", { count: "exact", head: true })
    .eq("source", "csv_import_signal")
    .eq("review_status", "pending")

  const navItems: { href: string; label: string; badge?: number }[] = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/contacts", label: "Contacts" },
    { href: "/admin/contacts/import", label: "Import" },
    ...(pendingChanges && pendingChanges > 0
      ? [{ href: "/admin/contacts/pending-changes", label: "Pending Changes", badge: pendingChanges }]
      : []),
    { href: "/admin/users", label: "Users" },
    { href: "/admin/email-verify", label: "Email Verify" },
    { href: "/admin/health", label: "Contact Health" },
    { href: "/admin/suppressions", label: "Suppressions" },
    { href: "/admin/opportunities", label: "Opportunities" },
    { href: "/admin/analytics", label: "Analytics" },
    { href: "/admin/reports", label: "Reports" },
    { href: "/admin/billing", label: "Billing" },
    { href: "/admin/audit-logs", label: "Audit Logs" },
    { href: "/admin/settings", label: "Settings" },
  ]

  return (
    <div className="min-h-screen bg-navy-dark text-white flex">
      <AdminSidebar navItems={navItems} />
      <main className="flex-1 overflow-auto lg:ml-0 pt-14 lg:pt-0">{children}</main>
    </div>
  )
}
