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

  async function doAction(action: string, extra?: Record<string, string>) {
    setError(null)
    setOpen(false)
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

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        className="text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-navy-dark transition-colors text-xs disabled:opacity-50"
      >
        {isPending ? "…" : "Actions ▾"}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1 w-44 bg-navy border border-navy-light rounded-lg shadow-xl overflow-hidden">
            {!isSelf && (
              <>
                <button
                  onClick={() => doAction(isSuspended ? "unsuspend" : "suspend")}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-navy-light transition-colors text-gray-300"
                >
                  {isSuspended ? "✓ Unsuspend" : "⊘ Suspend"}
                </button>
                <button
                  onClick={() =>
                    doAction("set_role", { role: currentRole === "admin" ? "user" : "admin" })
                  }
                  className="w-full text-left px-4 py-2 text-sm hover:bg-navy-light transition-colors text-gray-300"
                >
                  {currentRole === "admin" ? "↓ Remove admin" : "★ Make admin"}
                </button>
              </>
            )}
            {isSelf && (
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
