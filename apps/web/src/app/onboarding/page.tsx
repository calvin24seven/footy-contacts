"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const USER_TYPES = [
  { value: "player", label: "Player" },
  { value: "agent", label: "Agent / Manager" },
  { value: "club", label: "Club Official" },
  { value: "scout", label: "Scout" },
  { value: "media", label: "Media / Journalist" },
  { value: "other", label: "Other" },
]

const GOALS = [
  "Find agents to represent me",
  "Scout players",
  "Connect with clubs",
  "Find coaching staff",
  "Media & PR contacts",
  "Find opportunities",
  "Build my network",
  "Research the industry",
]

const LEVELS = [
  "Amateur", "Semi-professional", "Professional", "International", "Youth Academy",
]

interface StepData {
  user_type?: string
  full_name?: string
  primary_goals?: string[]
  country?: string
  city?: string
  football_level?: string
}

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<StepData>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  function nextStep(updates: Partial<StepData>) {
    setData((prev) => ({ ...prev, ...updates }))
    setStep((s) => s + 1)
  }

  async function complete(updates: Partial<StepData>) {
    setLoading(true)
    setError(null)
    const finalData = { ...data, ...updates }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const { error } = await supabase.from("profiles").update({
      user_type: finalData.user_type ?? null,
      full_name: finalData.full_name ?? null,
      primary_goals: (finalData.primary_goals ?? null) as string[] | null,
      country: finalData.country ?? null,
      city: finalData.city ?? null,
      football_level: finalData.football_level ?? null,
      onboarding_completed: true,
      onboarding_step: 4,
    }).eq("id", user.id)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push("/app")
    }
  }

  const totalSteps = 4
  const progress = Math.round((step / totalSteps) * 100)

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-xl font-bold text-gold">Footy Contacts</span>
          <p className="text-gray-400 text-sm mt-1">Step {step} of {totalSteps}</p>
          <div className="mt-3 h-1.5 bg-navy-light rounded-full overflow-hidden">
            <div
              className="h-full bg-gold rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-navy-light rounded-xl p-6">
          {step === 1 && (
            <Step1
              onNext={(v) => nextStep({ user_type: v.user_type, full_name: v.full_name })}
            />
          )}
          {step === 2 && (
            <Step2 onNext={(goals) => nextStep({ primary_goals: goals })} />
          )}
          {step === 3 && (
            <Step3
              onNext={(v) =>
                nextStep({ country: v.country, city: v.city, football_level: v.football_level })
              }
            />
          )}
          {step === 4 && (
            <Step4
              loading={loading}
              error={error}
              onComplete={() => complete({})}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function Step1({ onNext }: { onNext: (v: { user_type: string; full_name: string }) => void }) {
  const [userType, setUserType] = useState("")
  const [fullName, setFullName] = useState("")

  return (
    <div>
      <h2 className="text-white text-xl font-bold mb-1">Welcome! Tell us about yourself</h2>
      <p className="text-gray-400 text-sm mb-6">This helps us personalise your experience.</p>

      <label className="block text-sm text-gray-300 mb-2">Your full name</label>
      <input
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="e.g. James Smith"
        className="w-full px-4 py-3 bg-navy text-white rounded-lg border border-gray-600 focus:outline-none focus:border-gold placeholder-gray-500 mb-4"
      />

      <label className="block text-sm text-gray-300 mb-2">I am a…</label>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {USER_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setUserType(t.value)}
            className={`py-3 px-4 rounded-lg border text-sm font-medium transition-colors ${
              userType === t.value
                ? "border-gold bg-gold/10 text-gold"
                : "border-gray-600 text-gray-300 hover:border-gray-400"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <button
        disabled={!userType || !fullName.trim()}
        onClick={() => onNext({ user_type: userType, full_name: fullName.trim() })}
        className="w-full py-3 bg-gold text-navy rounded-lg font-semibold hover:bg-gold-dark transition-colors disabled:opacity-40"
      >
        Continue
      </button>
    </div>
  )
}

function Step2({ onNext }: { onNext: (goals: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([])

  function toggle(goal: string) {
    setSelected((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    )
  }

  return (
    <div>
      <h2 className="text-white text-xl font-bold mb-1">What are your main goals?</h2>
      <p className="text-gray-400 text-sm mb-6">Select all that apply.</p>

      <div className="grid grid-cols-1 gap-2 mb-6">
        {GOALS.map((goal) => (
          <button
            key={goal}
            onClick={() => toggle(goal)}
            className={`py-3 px-4 rounded-lg border text-sm text-left transition-colors ${
              selected.includes(goal)
                ? "border-gold bg-gold/10 text-gold"
                : "border-gray-600 text-gray-300 hover:border-gray-400"
            }`}
          >
            {goal}
          </button>
        ))}
      </div>

      <button
        disabled={selected.length === 0}
        onClick={() => onNext(selected)}
        className="w-full py-3 bg-gold text-navy rounded-lg font-semibold hover:bg-gold-dark transition-colors disabled:opacity-40"
      >
        Continue
      </button>
    </div>
  )
}

function Step3({
  onNext,
}: {
  onNext: (v: { country: string; city: string; football_level: string }) => void
}) {
  const [country, setCountry] = useState("")
  const [city, setCity] = useState("")
  const [level, setLevel] = useState("")

  return (
    <div>
      <h2 className="text-white text-xl font-bold mb-1">Where are you based?</h2>
      <p className="text-gray-400 text-sm mb-6">We&apos;ll show you relevant contacts nearby.</p>

      <label className="block text-sm text-gray-300 mb-2">Country</label>
      <input
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        placeholder="e.g. United Kingdom"
        className="w-full px-4 py-3 bg-navy text-white rounded-lg border border-gray-600 focus:outline-none focus:border-gold placeholder-gray-500 mb-4"
      />

      <label className="block text-sm text-gray-300 mb-2">City (optional)</label>
      <input
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="e.g. Manchester"
        className="w-full px-4 py-3 bg-navy text-white rounded-lg border border-gray-600 focus:outline-none focus:border-gold placeholder-gray-500 mb-4"
      />

      <label className="block text-sm text-gray-300 mb-2">Football level</label>
      <div className="grid grid-cols-2 gap-2 mb-6">
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={`py-2 px-3 rounded-lg border text-sm transition-colors ${
              level === l
                ? "border-gold bg-gold/10 text-gold"
                : "border-gray-600 text-gray-300 hover:border-gray-400"
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <button
        disabled={!country.trim()}
        onClick={() => onNext({ country: country.trim(), city: city.trim(), football_level: level })}
        className="w-full py-3 bg-gold text-navy rounded-lg font-semibold hover:bg-gold-dark transition-colors disabled:opacity-40"
      >
        Continue
      </button>
    </div>
  )
}

function Step4({
  loading,
  error,
  onComplete,
}: {
  loading: boolean
  error: string | null
  onComplete: () => void
}) {
  return (
    <div className="text-center py-4">
      <div className="text-5xl mb-4">⚽</div>
      <h2 className="text-white text-xl font-bold mb-2">You&apos;re all set!</h2>
      <p className="text-gray-300 text-sm mb-6">
        Your profile is ready. Start exploring thousands of football contacts.
      </p>
      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      <button
        disabled={loading}
        onClick={onComplete}
        className="w-full py-3 bg-gold text-navy rounded-lg font-semibold hover:bg-gold-dark transition-colors disabled:opacity-50"
      >
        {loading ? "Setting up your account…" : "Start searching"}
      </button>
    </div>
  )
}
