import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import SettingsClient from "./SettingsClient"
import type { JSX } from "react"

export default async function SettingsPage(): Promise<JSX.Element> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
      <p className="text-gray-400 text-sm mb-8">Manage your account security and preferences</p>
      <SettingsClient email={user.email ?? ""} />
    </div>
  )
}
