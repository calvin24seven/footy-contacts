import { createAdminClient } from "@/lib/supabase/admin"
import SuppressionClient from "./SuppressionClient"
import type { JSX } from "react"

export default async function SuppressionsPage(): Promise<JSX.Element> {
  const supabase = createAdminClient()

  const [suppressions, count] = await Promise.all([
    supabase
      .from("email_suppressions")
      .select("id, email, reason, category, source, created_at")
      .order("created_at", { ascending: false })
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
