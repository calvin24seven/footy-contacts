"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

interface Props {
  userId: string
  currentRole: string
  isSuspended: boolean
  isSelf: boolean
}

export default function UserActionsMenu({ userId, currentRole, isSuspended, isSelf }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creditsMode, setCreditsMode] = useState(false)
  const [creditsInput, setCreditsInput] = useState("10")

  async function doAction(action: string, extra?: Record<string, string | number>) {
    setError(null)
    setOpen(false)
    setCreditsMode(false)
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    })
    if (!res.ok) {
      const { error: msg } = await res.json().catch(() => ({ error: "Request failed" }))
      setError(msg ?? "Unknown error")
      return
    }
    startTransition(() => router.refresh())
  }

  function handleCreditsSubmit() {
    const n = parseInt(creditsInput, 10)
    if (!n || n < 1 || n > 10000) {
      setError("Enter a number between 1 and 10,000")
      return
    }
    doAction("add_credits", { amount: n })
  }

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => { setOpen((o) => !o); setCreditsMode(false) }}
        disabled={isPending}
        className="text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-navy-dark transition-colors text-xs disabled:opacity-50 cursor-pointer"
      >
        {isPending ? "…" : "Actions ▾"}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setCreditsMode(false) }} />
          <div className="absolute right-0 z-20 mt-1 w-52 bg-navy border border-navy-light rounded-lg shadow-xl overflow-hidden">
            {!isSelf ? (
              <>
                <button
                  onClick={() => doAction(isSuspended ? "unsuspend" : "suspend")}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-navy-light transition-colors text-gray-300 cursor-pointer"
                >
                  {isSuspended ? "✓ Unsuspend" : "⊘ Suspend"}
                </button>
                <button
                  onClick={() =>
                    doAction("set_role", { role: currentRole === "admin" ? "user" : "admin" })
                  }
                  className="w-full text-left px-4 py-2 text-sm hover:bg-navy-light transition-colors text-gray-300 cursor-pointer"
                >
                  {currentRole === "admin" ? "↓ Remove admin" : "★ Make admin"}
                </button>
                <div className="border-t border-navy-light" />
                {creditsMode ? (
                  <div className="px-3 py-2.5 space-y-2">
                    <p className="text-xs text-gray-400">Bonus unlocks to add</p>
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      value={creditsInput}
                      onChange={(e) => setCreditsInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleCreditsSubmit()}
                      className="w-full px-2 py-1.5 bg-navy-dark border border-gray-600 rounded text-white text-sm focus:outline-none focus:border-gold"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreditsSubmit}
                        className="flex-1 py-1 bg-gold text-navy rounded text-xs font-semibold hover:bg-yellow-400 transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => setCreditsMode(false)}
                        className="px-2 py-1 text-gray-500 hover:text-white text-xs transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setCreditsMode(true)}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-navy-light transition-colors text-gold cursor-pointer"
                  >
                    + Gift unlock credits
                  </button>
                )}
              </>
            ) : (
              <div className="px-4 py-2 text-xs text-gray-500">Can&#39;t modify self</div>
            )}
          </div>
        </>
      )}

      {error && (
        <div className="absolute right-0 mt-1 z-30 bg-red-900/80 text-red-200 text-xs rounded px-3 py-2 w-48">
          {error}
        </div>
      )}
    </div>
  )
}
