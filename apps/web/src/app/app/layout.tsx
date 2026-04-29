import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { JSX, ReactNode } from "react"
import TopNav from "./TopNav"
import BottomNav from "./BottomNav"
import { UnlocksProvider } from "./UnlocksProvider"

export default async function AppLayout({ children }: { children: ReactNode }): Promise<JSX.Element> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, role")
    .eq("id", user.id)
    .single()

  const isAdmin = profile?.role === "admin"

  return (
    <div className="min-h-screen bg-navy-dark text-white flex flex-col">
      <UnlocksProvider>
        <TopNav
          fullName={profile?.full_name ?? null}
          avatarUrl={profile?.avatar_url ?? null}
          email={user.email ?? null}
          isAdmin={isAdmin}
        />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
        <BottomNav
          fullName={profile?.full_name ?? null}
          avatarUrl={profile?.avatar_url ?? null}
          email={user.email ?? null}
          isAdmin={isAdmin}
        />
      </UnlocksProvider>
    </div>
  )
}
