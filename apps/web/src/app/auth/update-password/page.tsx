"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (err) {
      setError(err.message)
      return
    }

    setDone(true)
    setTimeout(() => router.push("/app"), 2000)
  }

  return (
    <div className="min-h-screen bg-[#080c17] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="text-gold font-bold text-2xl tracking-tight">Footy Contacts</span>
          <h1 className="text-white text-xl font-bold mt-4">Set a new password</h1>
          <p className="text-gray-400 text-sm mt-1">Choose a strong password for your account.</p>
        </div>

        {done ? (
          <div className="bg-green-900/40 border border-green-700 rounded-xl p-4 text-center">
            <p className="text-green-300 font-semibold">Password updated!</p>
            <p className="text-green-400 text-sm mt-1">Redirecting you to the app…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-xs mb-1">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="input-base w-full"
                placeholder="At least 8 characters"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs mb-1">Confirm new password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="input-base w-full"
                placeholder="Repeat your password"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gold text-navy rounded-lg font-semibold hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
