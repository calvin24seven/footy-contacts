import { createAdminClient } from "@/lib/supabase/admin"
import { Suspense } from "react"
import type { JSX } from "react"
import Link from "next/link"
import DateRangePicker from "@/components/admin/DateRangePicker"
import { resolveDateRange } from "@/components/admin/date-range-utils"

export const dynamic = "force-dynamic"

interface Props {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>
}

async function EmailContent({ from, to }: { from: string; to: string }) {
  const admin = createAdminClient()

  const fromTs = from + "T00:00:00Z"
  const toTs   = to   + "T23:59:59Z"

  const [
    emailJobs,
    emailEvents,
    suppressions,
    campaignEnrollments,
    emailJobsByTemplate,
  ] = await Promise.all([
    // Email jobs in period
    admin.from("email_jobs")
      .select("id, status, template_id, category, created_at, sent_at, delivered_at, failed_at")
      .gte("created_at", fromTs).lte("created_at", toTs),
    // Email events in period
    admin.from("email_events")
      .select("event_type, received_at, provider")
      .gte("received_at", fromTs).lte("received_at", toTs),
    // Suppressions added
    admin.from("email_suppressions")
      .select("id, reason", { count: "exact" })
      .gte("created_at", fromTs).lte("created_at", toTs),
    // Campaign enrollments
    admin.from("campaign_enrollments")
      .select("campaign, status, enrolled_at")
      .gte("enrolled_at", fromTs).lte("enrolled_at", toTs),
    // All-time by template
    admin.from("email_jobs")
      .select("template_id, status")
      .gte("created_at", fromTs).lte("created_at", toTs),
  ])

  const jobs = emailJobs.data ?? []
  const events = emailEvents.data ?? []

  // Delivery funnel
  const totalSent      = jobs.filter((j) => j.status !== "pending" && j.status !== "cancelled").length
  const delivered      = jobs.filter((j) => j.status === "delivered").length
  const failed         = jobs.filter((j) => j.status === "failed" || j.status === "bounced").length
  const pending        = jobs.filter((j) => j.status === "pending").length

  // Event type counts
  const eventTypeCounts: Record<string, number> = {}
  for (const e of events) {
    eventTypeCounts[e.event_type] = (eventTypeCounts[e.event_type] ?? 0) + 1
  }

  const deliveryRate = totalSent > 0 ? ((delivered / totalSent) * 100).toFixed(1) : "0.0"
  const bounceRate   = totalSent > 0 ? ((failed / totalSent) * 100).toFixed(1) : "0.0"
  const openCount    = eventTypeCounts["opened"] ?? 0
  const clickCount   = eventTypeCounts["clicked"] ?? 0
  const openRate     = delivered > 0 ? ((openCount / delivered) * 100).toFixed(1) : "0.0"
  const clickRate    = delivered > 0 ? ((clickCount / delivered) * 100).toFixed(1) : "0.0"

  // By template
  const templateStats: Record<string, { sent: number; delivered: number; failed: number }> = {}
  for (const j of emailJobsByTemplate.data ?? []) {
    if (!templateStats[j.template_id]) templateStats[j.template_id] = { sent: 0, delivered: 0, failed: 0 }
    templateStats[j.template_id].sent++
    if (j.status === "delivered") templateStats[j.template_id].delivered++
    if (j.status === "failed" || j.status === "bounced") templateStats[j.template_id].failed++
  }

  // Campaign enrollment breakdown
  const campaignCounts: Record<string, { total: number; completed: number }> = {}
  for (const e of campaignEnrollments.data ?? []) {
    if (!campaignCounts[e.campaign]) campaignCounts[e.campaign] = { total: 0, completed: 0 }
    campaignCounts[e.campaign].total++
    if (e.status === "completed") campaignCounts[e.campaign].completed++
  }

  // Suppression reasons
  const suppressionReasons: Record<string, number> = {}
  for (const s of suppressions.data ?? []) {
    suppressionReasons[s.reason] = (suppressionReasons[s.reason] ?? 0) + 1
  }

  // DLQ / failed jobs
  const dlqJobs = jobs.filter((j) => j.status === "failed").slice(0, 10)

  const statusColor: Record<string, string> = {
    delivered:       "text-green-400",
    sent:            "text-blue-400",
    pending:         "text-yellow-400",
    failed:          "text-red-400",
    bounced:         "text-red-400",
    cancelled:       "text-gray-400",
    complained:      "text-orange-400",
    delivery_delayed:"text-yellow-400",
  }

  return (
    <div className="space-y-8">
      {/* KPI row */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Emails Sent",      value: totalSent.toLocaleString(),   color: "text-white" },
          { label: "Delivered",        value: delivered.toLocaleString(),   color: "text-green-400" },
          { label: "Delivery Rate",    value: `${deliveryRate}%`,           color: Number(deliveryRate) > 90 ? "text-green-400" : "text-yellow-400" },
          { label: "Bounce Rate",      value: `${bounceRate}%`,            color: Number(bounceRate) > 5 ? "text-red-400" : "text-gray-400" },
          { label: "Opens",            value: openCount.toLocaleString(),   color: "text-white" },
          { label: "Open Rate",        value: `${openRate}%`,              color: "text-blue-400" },
          { label: "Clicks",           value: clickCount.toLocaleString(),  color: "text-white" },
          { label: "Click Rate",       value: `${clickRate}%`,             color: "text-blue-400" },
          { label: "Pending in queue", value: pending.toLocaleString(),    color: pending > 100 ? "text-yellow-400" : "text-gray-400" },
          { label: "Failed",           value: failed.toLocaleString(),     color: failed > 0 ? "text-red-400" : "text-gray-400" },
          { label: "New Suppressions", value: (suppressions.count ?? 0).toLocaleString(), color: "text-yellow-400" },
          { label: "Complaints (spam)", value: (eventTypeCounts["complained"] ?? 0).toLocaleString(), color: (eventTypeCounts["complained"] ?? 0) > 0 ? "text-red-400" : "text-gray-400" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-navy-light rounded-xl p-4">
            <p className="text-gray-400 text-xs mb-1">{kpi.label}</p>
            <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Open/click rate note */}
      {openCount === 0 && delivered > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl px-5 py-4">
          <p className="text-yellow-300 text-sm font-semibold">Open & click tracking not yet enabled</p>
          <p className="text-yellow-400/80 text-xs mt-1">
            To track opens and clicks, configure Resend webhook events to include <code className="font-mono">email.opened</code> and <code className="font-mono">email.clicked</code> in your Resend dashboard. Currently only delivery events are captured.
          </p>
        </div>
      )}

      {/* Event type breakdown */}
      {Object.keys(eventTypeCounts).length > 0 && (
        <div className="bg-navy-light rounded-xl p-5">
          <h3 className="text-white text-sm font-semibold mb-4">Email events breakdown</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(eventTypeCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => (
                <div key={type} className="bg-navy rounded-lg p-3">
                  <p className={`text-xl font-bold ${statusColor[type] ?? "text-white"}`}>{count.toLocaleString()}</p>
                  <p className="text-gray-400 text-xs mt-0.5 capitalize">{type.replace(/_/g, " ")}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* By template */}
      {Object.keys(templateStats).length > 0 && (
        <div className="bg-navy-light rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-navy-dark">
            <h3 className="text-white text-sm font-semibold">Performance by template</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-dark">
                {["Template", "Sent", "Delivered", "Failed", "Delivery %"].map((h) => (
                  <th key={h} className="text-left px-4 py-2 text-gray-400 text-xs font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(templateStats)
                .sort((a, b) => b[1].sent - a[1].sent)
                .map(([tmpl, stats]) => (
                  <tr key={tmpl} className="border-b border-navy-dark/50 hover:bg-navy/30">
                    <td className="px-4 py-2 text-white text-xs font-mono">{tmpl}</td>
                    <td className="px-4 py-2 text-gray-300 text-xs">{stats.sent}</td>
                    <td className="px-4 py-2 text-green-400 text-xs">{stats.delivered}</td>
                    <td className="px-4 py-2 text-red-400 text-xs">{stats.failed}</td>
                    <td className="px-4 py-2 text-gray-300 text-xs">
                      {stats.sent > 0 ? `${((stats.delivered / stats.sent) * 100).toFixed(0)}%` : "—"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Campaign enrollments */}
      {Object.keys(campaignCounts).length > 0 && (
        <div className="bg-navy-light rounded-xl p-5">
          <h3 className="text-white text-sm font-semibold mb-4">Campaign enrollments in period</h3>
          <div className="space-y-3">
            {Object.entries(campaignCounts)
              .sort((a, b) => b[1].total - a[1].total)
              .map(([campaign, stats]) => (
                <div key={campaign} className="flex items-center gap-4">
                  <span className="text-gray-300 text-sm font-mono w-40 truncate">{campaign}</span>
                  <div className="flex-1 bg-navy rounded-full h-2">
                    <div
                      className="bg-purple-400 h-2 rounded-full"
                      style={{ width: `${stats.completed > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-gray-400 text-xs">{stats.completed}/{stats.total} completed</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Suppression reasons */}
      {Object.keys(suppressionReasons).length > 0 && (
        <div className="bg-navy-light rounded-xl p-5">
          <h3 className="text-white text-sm font-semibold mb-4">New suppressions by reason</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(suppressionReasons).map(([reason, count]) => (
              <div key={reason} className="bg-navy rounded-lg px-3 py-2">
                <p className="text-lg font-bold text-red-400">{count}</p>
                <p className="text-gray-400 text-xs capitalize">{reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Failed jobs */}
      {dlqJobs.length > 0 && (
        <div className="bg-navy-light rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-navy-dark">
            <h3 className="text-white text-sm font-semibold">Failed email jobs</h3>
            <Link href="/admin/health" className="text-gold text-xs hover:underline">View health →</Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-dark">
                {["ID", "Template", "Status", "Failed at"].map((h) => (
                  <th key={h} className="text-left px-4 py-2 text-gray-400 text-xs font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dlqJobs.map((j) => (
                <tr key={j.id} className="border-b border-navy-dark/50">
                  <td className="px-4 py-2 text-gray-400 text-xs font-mono">{j.id.slice(0, 8)}…</td>
                  <td className="px-4 py-2 text-gray-300 text-xs">{j.template_id}</td>
                  <td className="px-4 py-2">
                    <span className={`text-xs ${statusColor[j.status] ?? "text-gray-400"}`}>{j.status}</span>
                  </td>
                  <td className="px-4 py-2 text-gray-400 text-xs">
                    {j.failed_at ? new Date(j.failed_at).toLocaleDateString("en-GB") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default async function AdminEmailAnalyticsPage({ searchParams }: Props): Promise<JSX.Element> {
  const params  = await searchParams
  const { from, to, preset } = resolveDateRange(params)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/analytics" className="text-gray-400 text-sm hover:text-white">Analytics</Link>
            <span className="text-gray-600">›</span>
            <span className="text-white text-sm">Email</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Email Analytics</h1>
        </div>
        <Suspense>
          <DateRangePicker preset={preset} from={from} to={to} />
        </Suspense>
      </div>

      <Suspense fallback={<div className="animate-pulse h-48 bg-navy-light rounded-xl" />}>
        <EmailContent from={from} to={to} />
      </Suspense>
    </div>
  )
}
