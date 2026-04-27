import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function ExportsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [exportsResult, usageResult] = await Promise.all([
    supabase
      .from("exports")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("subscription_usage_periods")
      .select("export_count, period_end")
      .eq("user_id", user!.id)
      .lte("period_start", new Date().toISOString())
      .gte("period_end", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const exports = exportsResult.data ?? []
  const currentUsage = usageResult.data

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Export History</h1>
        <p className="text-gray-400 text-sm">CSV exports of your unlocked contacts</p>
      </div>

      {/* Usage this period */}
      {currentUsage && (
        <div className="bg-navy-light rounded-xl px-5 py-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Contacts exported this period</p>
            <p className="text-white font-semibold mt-0.5">{currentUsage.export_count}</p>
          </div>
          <p className="text-xs text-gray-500">
            Resets{" "}
            {new Date(currentUsage.period_end).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            })}
          </p>
        </div>
      )}

      {/* Export from lists CTA */}
      <div className="bg-navy-light rounded-xl px-5 py-4 mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-300">Export your unlocked contacts from any list</p>
        <Link
          href="/app/lists"
          className="text-gold text-sm hover:underline shrink-0 ml-4"
        >
          Go to Lists →
        </Link>
      </div>

      {/* History */}
      {exports.length > 0 ? (
        <div className="space-y-2">
          {exports.map((exp) => (
            <div
              key={exp.id}
              className="bg-navy-light rounded-xl px-5 py-4 flex items-center justify-between"
            >
              <div>
                <p className="text-white font-medium">
                  {exp.contact_count} contact{exp.contact_count !== 1 ? "s" : ""}
                </p>
                <p className="text-gray-400 text-sm mt-0.5">
                  {new Date(exp.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {exp.list_id ? " · from list" : ""}
                </p>
              </div>
              <span className="text-xs bg-navy text-gray-400 px-2 py-1 rounded uppercase tracking-wide">
                {exp.export_type}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg mb-2">No exports yet</p>
          <p className="text-sm">
            Use the{" "}
            <Link href="/app/lists" className="text-gold hover:underline">
              Export CSV
            </Link>{" "}
            button on any of your lists.
          </p>
        </div>
      )}
    </div>
  )
}
