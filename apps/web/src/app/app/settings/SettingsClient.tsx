"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function SettingsClient({ email }: { email: string }) {
  const router = useRouter()

  // Password reset
  const [resetSent, setResetSent] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetting, setResetting] = useState(false)

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  async function handlePasswordReset() {
    setResetting(true)
    setResetError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })
    setResetting(false)
    if (error) {
      setResetError(error.message)
    } else {
      setResetSent(true)
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== "DELETE") return
    setDeleting(true)
    setDeleteError(null)

    const res = await fetch("/api/account", { method: "DELETE" })
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string }
      setDeleteError(body.error ?? "Failed to delete account. Please try again.")
      setDeleting(false)
      return
    }

    // Sign out then redirect to home
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="space-y-6">
      {/* Security */}
      <div className="bg-navy-light rounded-xl p-5 space-y-4">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Security</h2>
        <div>
          <p className="text-gray-400 text-sm mb-3">
            Send a password reset link to{" "}
            <span className="text-white">{email}</span>.
          </p>
          {resetSent ? (
            <p className="text-green-400 text-sm">
              Password reset email sent. Check your inbox.
            </p>
          ) : (
            <>
              <button
                onClick={handlePasswordReset}
                disabled={resetting}
                className="btn-secondary disabled:opacity-50"
              >
                {resetting ? "Sending…" : "Send password reset email"}
              </button>
              {resetError && (
                <p className="text-red-400 text-sm mt-2">{resetError}</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Notifications placeholder */}
      <div className="bg-navy-light rounded-xl p-5 space-y-3">
        <h2 className="text-white font-semibold text-sm uppercase tracking-wide">Quick links</h2>
        <div className="flex flex-col gap-2 text-sm">
          <a href="/app/profile" className="text-gold hover:underline">Edit profile →</a>
          <a href="/app/billing" className="text-gold hover:underline">Manage billing →</a>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-navy-light rounded-xl p-5 space-y-4 border border-red-900/50">
        <h2 className="text-red-400 font-semibold text-sm uppercase tracking-wide">Danger zone</h2>
        <p className="text-gray-400 text-sm">
          Permanently delete your account and all associated data. This cannot be undone.
        </p>
        <div>
          <label className="block text-gray-400 text-xs mb-1">
            Type <span className="text-white font-mono font-bold">DELETE</span> to confirm
          </label>
          <input
            type="text"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            className="input-base max-w-xs"
            placeholder="DELETE"
            autoComplete="off"
          />
        </div>
        {deleteError && <p className="text-red-400 text-sm">{deleteError}</p>}
        <button
          onClick={handleDeleteAccount}
          disabled={deleteConfirm !== "DELETE" || deleting}
          className="px-4 py-2 text-sm bg-red-800 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {deleting ? "Deleting account…" : "Delete my account"}
        </button>
      </div>
    </div>
  )
}
