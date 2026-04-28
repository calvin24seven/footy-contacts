import { createAdminClient } from "@/lib/supabase/server"
import SuppressionClient from "./SuppressionClient"
import type { JSX } from "react"

export default async function SuppressionsPage(): Promise<JSX.Element> {
  const supabase = await createAdminClient()

  const [suppressions, count] = await Promise.all([
    supabase
      .from("email_suppressions")
      .select("id, email, reason, added_at, added_by")
      .order("added_at", { ascending: false })
      .limit(500),
    supabase.from("email_suppressions").select("id", { count: "exact", head: true }),
  ])

  return (
    <SuppressionClient
      initialSuppressions={suppressions.data ?? []}
      totalCount={count.count ?? 0}
    />
  )
}
