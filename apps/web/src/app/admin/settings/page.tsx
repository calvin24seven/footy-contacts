import { createAdminClient } from "@/lib/supabase/server"
import SettingsEditor from "./SettingsEditor"
import type { JSX } from "react"

export default async function AdminSettingsPage(): Promise<JSX.Element> {
  const supabase = await createAdminClient()

  const { data: settings } = await supabase
    .from("app_settings")
    .select("key, value, description, updated_at")
    .order("key")

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 text-sm mt-1">
            Application configuration key/value pairs. Changes take effect immediately.
          </p>
        </div>
      </div>

      <SettingsEditor initialSettings={settings ?? []} />
    </div>
  )
}
