import { createAdminClient } from "@/lib/supabase/server"
import ImportDetailClient from "./ImportDetailClient"
import { notFound } from "next/navigation"
import type { JSX } from "react"

export default async function ImportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<JSX.Element> {
  const { id } = await params
  const supabase = await createAdminClient()

  const [importRecord, rowStats] = await Promise.all([
    supabase
      .from("csv_imports")
      .select("*")
      .eq("id", id)
      .single(),
    supabase
      .from("csv_import_rows")
      .select("status, count:id", { count: "exact" })
      .eq("csv_import_id", id),
  ])

  if (!importRecord.data) notFound()

  // Count rows by status
  const { data: statusBreakdown } = await supabase
    .from("csv_import_rows")
    .select("status")
    .eq("csv_import_id", id)

  const statusCounts: Record<string, number> = {}
  for (const r of statusBreakdown ?? []) {
    statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1
  }

  // Count how many contacts from this import are now linked to opportunities/lists (can't undo those)
  const { count: linkedCount } = await supabase
    .from("csv_import_rows")
    .select("contact_id", { count: "exact", head: true })
    .eq("csv_import_id", id)
    .eq("status", "success")
    .not("contact_id", "is", null)

  return (
    <ImportDetailClient
      importRecord={importRecord.data}
      statusCounts={statusCounts}
      totalRows={rowStats.count ?? 0}
      linkedCount={linkedCount ?? 0}
    />
  )
}
