"use client"

import { useState } from "react"

type Result = {
  ok: boolean
  queued?: number
  suppressed?: number
  total?: number
  message?: string
  error?: string
  testMode?: boolean
  testEmail?: string
}

export default function CampaignsClient() {
  const [sending, setSending] = useState(false)
  const [result, setResult]   = useState<Result | null>(null)
  const [testEmail, setTestEmail] = useState("")

  async function trigger(mode: "test" | "live") {
    if (mode === "live" && !confirm("Send waitlist-launch email to all 40 waitlist subscribers?")) return
    setSending(true)
    setResult(null)
    try {
      const url = mode === "test"
        ? `/api/admin/campaigns/waitlist-launch?testEmail=${encodeURIComponent(testEmail)}`
        : `/api/admin/campaigns/waitlist-launch`
      const res  = await fetch(url, { method: "POST" })
      const data = await res.json() as Result
      setResult(data)
    } catch (e) {
      setResult({ ok: false, error: String(e) })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      {/* Test send */}
      <div className="bg-navy-light rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-white font-semibold mb-1">Test send</h2>
          <p className="text-gray-400 text-sm">Send the waitlist-launch email to one address first.</p>
        </div>
        <div className="flex gap-3">
          <input
            type="email"
            placeholder="you@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="flex-1 bg-navy border border-navy-dark rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold"
          />
          <button
            onClick={() => trigger("test")}
            disabled={sending || !testEmail.includes("@")}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            {sending ? "Sending…" : "Send test"}
          </button>
        </div>
      </div>

      {/* Live send */}
      <div className="bg-navy-light rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-white font-semibold mb-1">Send to all waitlist</h2>
          <p className="text-gray-400 text-sm">
            Queues the <span className="font-mono text-xs text-gray-300">waitlist-launch</span> email
            for all unsuppressed waitlist subscribers. Idempotent — safe to re-run.
          </p>
        </div>
        <button
          onClick={() => trigger("live")}
          disabled={sending}
          className="btn-primary text-sm disabled:opacity-50"
        >
          {sending ? "Queuing…" : "Send to all waitlist →"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-xl p-5 text-sm ${result.ok ? "bg-green-900/30 border border-green-700/40" : "bg-red-900/30 border border-red-700/40"}`}>
          {result.ok ? (
            <div className="space-y-1">
              <p className="text-green-400 font-semibold">
                {result.testMode ? `Test email queued → ${result.testEmail}` : `Done — ${result.queued} emails queued`}
              </p>
              {!result.testMode && (
                <p className="text-gray-400">
                  {result.suppressed} suppressed · {result.total} total waitlist
                </p>
              )}
              <p className="text-gray-400 mt-2">{result.message}</p>
            </div>
          ) : (
            <p className="text-red-400">{result.error}</p>
          )}
        </div>
      )}
    </div>
  )
}
