import { createAdminClient } from "@/lib/supabase/admin"
import { notFound } from "next/navigation"
import type { JSX } from "react"
import Link from "next/link"
import UserActionsMenu from "../UserActionsMenu"
import { createClient } from "@/lib/supabase/server"

interface Props {
  params: Promise<{ id: string }>
}

export const dynamic = "force-dynamic"

export default async function AdminUserDetailPage({ params }: Props): Promise<JSX.Element> {
  const { id: userId } = await params
  const admin = createAdminClient()
  const userClient = await createClient()
  const { data: { user: me } } = await userClient.auth.getUser()

  const [
    profileResult,
    subResult,
    unlocks,
    exports_,
    usagePeriods,
    loginActivity,
    billingEvents,
    emailJobs,
    scraperFlags,
    campaignEnrollments,
  ] = await Promise.all([
    admin.from("profiles")
      .select("*")
      .eq("id", userId)
      .single(),
    admin.from("subscriptions")
      .select("*, plans(name, code, monthly_price_gbp, monthly_unlock_limit, monthly_export_limit)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
    admin.from("contact_unlocks")
      .select("id, unlock_type, created_at, contact_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30),
    admin.from("exports")
      .select("id, contact_count, export_type, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    admin.from("subscription_usage_periods")
      .select("*, plans(name)")
      .eq("user_id", userId)
      .order("period_start", { ascending: false })
      .limit(6),
    admin.from("user_login_activity" as never)
      .select("action, ip_address, created_at")
      .eq("user_id" as never, userId)
      .in("action" as never, ["login", "user_signedup"])
      .order("created_at" as never, { ascending: false })
      .limit(20),
    admin.from("billing_events")
      .select("*, plans(name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    admin.from("email_jobs")
      .select("id, template_id, status, created_at, sent_at, delivered_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
    admin.from("scraper_flags")
      .select("*")
      .eq("user_id", userId)
      .order("flagged_at", { ascending: false }),
    admin.from("campaign_enrollments")
      .select("*")
      .eq("user_id", userId)
      .order("enrolled_at", { ascending: false }),
  ])

  if (!profileResult.data) notFound()

  const profile = profileResult.data
  const subs    = subResult.data ?? []
  const activeSub = subs.find((s) => s.status === "active" || s.status === "trialing")
  const plan = activeSub?.plans as { name: string; code: string; monthly_price_gbp: number; monthly_unlock_limit: number; monthly_export_limit: number } | null

  // Current period usage
  const currentUsage = usagePeriods.data?.[0]
  const unlockLimit  = plan?.monthly_unlock_limit ?? 3
  const exportLimit  = plan?.monthly_export_limit ?? 0
  const unlockUsed   = currentUsage?.unlock_count ?? 0
  const exportUsed   = currentUsage?.export_count ?? 0

  const logins = loginActivity as unknown as { action: string; ip_address: string; created_at: string }[]
  const lastLogin = (logins ?? []).find((l) => l.action === "login")

  function statusBadge(s: string) {
    const map: Record<string, string> = {
      active:   "bg-green-900/40 text-green-300",
      trialing: "bg-blue-900/40 text-blue-300",
      canceled: "bg-gray-800 text-gray-400",
      past_due: "bg-red-900/40 text-red-400",
    }
    return map[s] ?? "bg-gray-800 text-gray-400"
  }

  const emailStatusColor: Record<string, string> = {
    delivered:       "text-green-400",
    sent:            "text-blue-400",
    pending:         "text-yellow-400",
    failed:          "text-red-400",
    bounced:         "text-red-400",
    cancelled:       "text-gray-500",
    complained:      "text-orange-400",
    delivery_delayed:"text-yellow-400",
  }

  const billingEventColor: Record<string, string> = {
    subscription_created:   "text-green-400",
    subscription_cancelled: "text-red-400",
    subscription_renewed:   "text-blue-400",
    plan_upgraded:          "text-gold",
    plan_downgraded:        "text-yellow-400",
    trial_started:          "text-purple-400",
    trial_converted:        "text-green-400",
    payment_failed:         "text-red-400",
    payment_recovered:      "text-green-400",
  }

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/admin/users" className="text-gray-400 hover:text-white">Users</Link>
        <span className="text-gray-600">›</span>
        <span className="text-white truncate max-w-xs">{profile.full_name ?? profile.email ?? userId}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">{profile.full_name ?? profile.email ?? "Unknown User"}</h1>
          {profile.email && profile.full_name && (
            <p className="text-gray-400 text-sm mt-0.5">{profile.email}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {profile.role === "admin" && (
              <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded">Admin</span>
            )}
            {profile.is_suspended && (
              <span className="text-xs bg-red-900/40 text-red-300 px-2 py-0.5 rounded">Suspended</span>
            )}
            {profile.user_type && (
              <span className="text-xs bg-navy text-gray-400 px-2 py-0.5 rounded capitalize">{profile.user_type.replace(/_/g, " ")}</span>
            )}
            {(scraperFlags.data?.length ?? 0) > 0 && (
              <span className="text-xs bg-orange-900/40 text-orange-300 px-2 py-0.5 rounded">⚑ Scraper flag</span>
            )}
          </div>
        </div>
        <UserActionsMenu
          userId={userId}
          currentRole={profile.role ?? "user"}
          isSuspended={profile.is_suspended}
          isSelf={me?.id === userId}
        />
      </div>

      {/* Overview cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-navy-light rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Plan</p>
          <p className="text-white font-bold">{plan?.name ?? "Free"}</p>
          {activeSub && (
            <p className="text-gray-400 text-xs mt-1">
              {activeSub.cancel_at_period_end
                ? <span className="text-yellow-400">Cancelling at period end</span>
                : <span className={activeSub.status === "active" ? "text-green-400" : "text-blue-400"}>{activeSub.status}</span>}
            </p>
          )}
          {activeSub?.current_period_end && (
            <p className="text-gray-500 text-xs mt-0.5">
              Renews {new Date(activeSub.current_period_end).toLocaleDateString("en-GB")}
            </p>
          )}
        </div>

        <div className="bg-navy-light rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Unlocks this period</p>
          <p className="text-white font-bold text-xl">{unlockUsed} / {unlockLimit === -1 ? "∞" : unlockLimit}</p>
          {unlockLimit !== -1 && unlockLimit > 0 && (
            <div className="mt-2 bg-navy rounded-full h-1.5">
              <div
                className="bg-gold h-1.5 rounded-full"
                style={{ width: `${Math.min(Math.round((unlockUsed / unlockLimit) * 100), 100)}%` }}
              />
            </div>
          )}
          <p className="text-gray-500 text-xs mt-1">Lifetime: {profile.lifetime_unlocks_used}</p>
        </div>

        <div className="bg-navy-light rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Exports this period</p>
          <p className="text-white font-bold text-xl">{exportUsed} / {exportLimit === -1 ? "∞" : exportLimit}</p>
          {exportLimit > 0 && exportLimit !== -1 && (
            <div className="mt-2 bg-navy rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full"
                style={{ width: `${Math.min(Math.round((exportUsed / exportLimit) * 100), 100)}%` }}
              />
            </div>
          )}
        </div>

        <div className="bg-navy-light rounded-xl p-4">
          <p className="text-gray-400 text-xs mb-1">Account</p>
          <p className="text-white font-bold text-sm">
            Joined {new Date(profile.created_at).toLocaleDateString("en-GB")}
          </p>
          {lastLogin && (
            <p className="text-gray-400 text-xs mt-1">
              Last login {new Date(lastLogin.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
          )}
          {profile.bonus_unlock_credits > 0 && (
            <p className="text-gold text-xs mt-1">+{profile.bonus_unlock_credits} bonus credits</p>
          )}
        </div>
      </div>

      {/* Profile details */}
      <div className="bg-navy-light rounded-xl p-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        {[
          ["User ID",    profile.id],
          ["Email",      profile.email ?? "—"],
          ["Username",   profile.username ?? "—"],
          ["City",       profile.city ?? "—"],
          ["Country",    profile.country ?? "—"],
          ["Region preference", profile.preferred_region ?? "—"],
          ["Onboarding", profile.onboarding_completed ? `Completed (step ${profile.onboarding_step ?? "??"})` : `Incomplete (step ${profile.onboarding_step ?? 0})`],
          ["Free unlock used", profile.free_unlock_used ? "Yes" : "No"],
          ["Suspended reason", profile.suspended_reason ?? (profile.is_suspended ? "unknown" : "—")],
        ].map(([label, value]) => (
          <div key={label as string}>
            <p className="text-gray-500 text-xs">{label}</p>
            <p className="text-gray-200 text-sm mt-0.5 break-all">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Subscription history */}
        <div className="bg-navy-light rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-navy-dark">
            <h3 className="text-white text-sm font-semibold">Subscription history</h3>
          </div>
          {subs.length === 0 ? (
            <p className="px-5 py-4 text-gray-500 text-xs">Free user — no subscriptions</p>
          ) : (
            <div className="divide-y divide-navy-dark/50">
              {subs.map((s) => {
                const p = s.plans as { name: string; monthly_price_gbp: number } | null
                return (
                  <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-white text-xs font-semibold">{p?.name ?? "Unknown plan"}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        Started {new Date(s.created_at).toLocaleDateString("en-GB")}
                        {s.current_period_end && ` · Renews ${new Date(s.current_period_end).toLocaleDateString("en-GB")}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.cancel_at_period_end && (
                        <span className="text-yellow-400 text-xs">Cancelling</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded ${statusBadge(s.status)}`}>{s.status}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Billing events */}
        <div className="bg-navy-light rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-navy-dark">
            <h3 className="text-white text-sm font-semibold">Billing events</h3>
          </div>
          {(billingEvents.data?.length ?? 0) === 0 ? (
            <p className="px-5 py-4 text-gray-500 text-xs">No billing events yet</p>
          ) : (
            <div className="divide-y divide-navy-dark/50 max-h-72 overflow-y-auto">
              {(billingEvents.data ?? []).map((e) => {
                const ep = e.plans as { name: string } | null
                return (
                  <div key={e.id} className="px-5 py-2 flex items-center justify-between">
                    <div>
                      <span className={`text-xs ${billingEventColor[e.event_type] ?? "text-gray-400"}`}>
                        {e.event_type.replace(/_/g, " ")}
                      </span>
                      {ep && <span className="text-gray-500 text-xs ml-2">{ep.name}</span>}
                    </div>
                    <div className="flex items-center gap-3">
                      {Number(e.mrr_change) !== 0 && (
                        <span className={`text-xs ${Number(e.mrr_change) > 0 ? "text-green-400" : "text-red-400"}`}>
                          {Number(e.mrr_change) > 0 ? "+" : ""}£{Number(e.mrr_change).toFixed(0)}
                        </span>
                      )}
                      <span className="text-gray-500 text-xs">
                        {new Date(e.created_at).toLocaleDateString("en-GB")}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Unlock history */}
      <div className="bg-navy-light rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-navy-dark">
          <h3 className="text-white text-sm font-semibold">Unlock history</h3>
          <span className="text-gray-400 text-xs">{unlocks.data?.length ?? 0} shown</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-navy-dark">
                {["Contact ID", "Type", "When"].map((h) => (
                  <th key={h} className="text-left px-4 py-2 text-gray-400 text-xs font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(unlocks.data?.length ?? 0) === 0 ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500 text-xs">No unlocks yet</td></tr>
              ) : (
                (unlocks.data ?? []).map((u) => (
                  <tr key={u.id} className="border-b border-navy-dark/50 hover:bg-navy/30">
                    <td className="px-4 py-2 text-gray-400 text-xs font-mono">{u.contact_id.slice(0, 12)}…</td>
                    <td className="px-4 py-2 text-gold text-xs capitalize">{u.unlock_type}</td>
                    <td className="px-4 py-2 text-gray-400 text-xs">
                      {new Date(u.created_at).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Usage periods */}
        <div className="bg-navy-light rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-navy-dark">
            <h3 className="text-white text-sm font-semibold">Usage periods</h3>
          </div>
          {(usagePeriods.data?.length ?? 0) === 0 ? (
            <p className="px-5 py-4 text-gray-500 text-xs">No usage periods recorded</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-navy-dark">
                  {["Period", "Plan", "Unlocks", "Exports"].map((h) => (
                    <th key={h} className="text-left px-4 py-2 text-gray-400 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(usagePeriods.data ?? []).map((p) => {
                  const pl = p.plans as { name: string } | null
                  return (
                    <tr key={p.id} className="border-b border-navy-dark/50">
                      <td className="px-4 py-2 text-gray-300">
                        {new Date(p.period_start).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-2 text-gray-400">{pl?.name ?? "—"}</td>
                      <td className="px-4 py-2 text-gold">{p.unlock_count}</td>
                      <td className="px-4 py-2 text-blue-400">{p.export_count}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Email history */}
        <div className="bg-navy-light rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-navy-dark">
            <h3 className="text-white text-sm font-semibold">Email history</h3>
          </div>
          {(emailJobs.data?.length ?? 0) === 0 ? (
            <p className="px-5 py-4 text-gray-500 text-xs">No emails sent to this user</p>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-navy-dark/50">
              {(emailJobs.data ?? []).map((j) => (
                <div key={j.id} className="px-5 py-2 flex items-center justify-between">
                  <div>
                    <p className="text-gray-300 text-xs">{j.template_id}</p>
                    <p className="text-gray-500 text-xs">{new Date(j.created_at).toLocaleDateString("en-GB")}</p>
                  </div>
                  <span className={`text-xs ${emailStatusColor[j.status] ?? "text-gray-400"}`}>{j.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Login activity */}
      {(logins ?? []).length > 0 && (
        <div className="bg-navy-light rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-navy-dark">
            <h3 className="text-white text-sm font-semibold">Login activity</h3>
          </div>
          <div className="max-h-60 overflow-y-auto divide-y divide-navy-dark/50">
            {(logins ?? []).map((l, i) => (
              <div key={i} className="px-5 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-xs capitalize">{l.action.replace(/_/g, " ")}</span>
                  {l.ip_address && (
                    <span className="text-gray-600 text-xs font-mono">{l.ip_address}</span>
                  )}
                </div>
                <span className="text-gray-500 text-xs">
                  {new Date(l.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaign enrollments */}
      {(campaignEnrollments.data?.length ?? 0) > 0 && (
        <div className="bg-navy-light rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-navy-dark">
            <h3 className="text-white text-sm font-semibold">Campaign enrollments</h3>
          </div>
          <div className="divide-y divide-navy-dark/50">
            {(campaignEnrollments.data ?? []).map((e) => (
              <div key={e.id} className="px-5 py-2 flex items-center justify-between">
                <span className="text-gray-300 text-xs font-mono">{e.campaign}</span>
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${e.status === "completed" ? "text-green-400" : e.status === "active" ? "text-blue-400" : "text-gray-400"}`}>
                    {e.status}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {new Date(e.enrolled_at).toLocaleDateString("en-GB")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scraper flags */}
      {(scraperFlags.data?.length ?? 0) > 0 && (
        <div className="bg-orange-900/20 border border-orange-700/30 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-orange-700/30">
            <h3 className="text-orange-300 text-sm font-semibold">⚑ Scraper flags</h3>
          </div>
          <div className="divide-y divide-orange-900/20">
            {(scraperFlags.data ?? []).map((f) => (
              <div key={f.id} className="px-5 py-2 flex items-center justify-between">
                <span className="text-orange-200 text-xs">{f.reason}</span>
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${f.reviewed ? "text-green-400" : "text-yellow-400"}`}>
                    {f.reviewed ? "Reviewed" : "Pending review"}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {new Date(f.flagged_at).toLocaleDateString("en-GB")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
