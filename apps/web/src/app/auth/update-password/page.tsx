"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import AuthSplitLayout from "@/components/auth/AuthSplitLayout"
import { updatePasswordSchema } from "@/lib/validations"

function PasswordStrength({ password }: { password: string }) {
  const hasLength = password.length >= 8
  const hasSymbol = /[0-9!@#$%^&*()\-_=+\[\]{};':"\\|,.<>/?]/.test(password)
  if (!password) return null
  return (
    <ul className="mt-1.5 space-y-1">
      <li className={`flex items-center gap-1.5 text-xs ${hasLength ? "text-green-400" : "text-gray-500"}`}>
        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {hasLength
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
        </svg>
        At least 8 characters
      </li>
      <li className={`flex items-center gap-1.5 text-xs ${hasSymbol ? "text-green-400" : "text-gray-500"}`}>
        <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {hasSymbol
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />}
        </svg>
        At least one number or symbol
      </li>
    </ul>
  )
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete: string
  placeholder: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-1.5">
      <label className="block text-gray-400 text-xs font-medium">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="input-base pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  )
}

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

    const parsed = updatePasswordSchema.safeParse({ password, confirmPassword: confirm })
    if (!parsed.success) {
      setError(parsed.error.errors[0].message)
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (err) {
      setError("Something went wrong. Please request a new reset link.")
      return
    }

    setDone(true)
    setTimeout(() => router.push("/app"), 2000)
  }

  return (
    <AuthSplitLayout variant="update-password">
      <div className="space-y-6">
        <div>
          <h2 className="text-white text-2xl font-bold mb-1.5">Set a new password</h2>
          <p className="text-gray-400 text-sm">
            Choose something strong. You&apos;ll use this every time you sign in.
          </p>
        </div>

        {done ? (
          <div className="bg-green-900/40 border border-green-700/60 rounded-xl p-4 text-center space-y-1">
            <p className="text-green-300 font-semibold">Password updated.</p>
            <p className="text-green-400/80 text-sm">Taking you to the app…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <PasswordField
                label="New password"
                value={password}
                onChange={setPassword}
                autoComplete="new-password"
                placeholder="At least 8 characters"
              />
              <PasswordStrength password={password} />
            </div>

            <PasswordField
              label="Confirm new password"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
              placeholder="Repeat your password"
            />

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </AuthSplitLayout>
  )
}
