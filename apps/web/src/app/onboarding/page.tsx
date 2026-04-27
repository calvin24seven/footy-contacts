"use client"

export const dynamic = "force-dynamic"

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

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Antigua and Barbuda",
  "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain",
  "Bangladesh", "Barbados", "Belarus", "Belgium", "Belize", "Benin", "Bhutan",
  "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
  "Burkina Faso", "Burundi", "Cabo Verde", "Cambodia", "Cameroon", "Canada",
  "Central African Republic", "Chad", "Chile", "China", "Colombia", "Comoros",
  "Congo", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Democratic Republic of the Congo", "Denmark", "Djibouti", "Dominica",
  "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea",
  "Eritrea", "Estonia", "Eswatini", "Ethiopia", "Fiji", "Finland", "France",
  "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Greece", "Grenada",
  "Guatemala", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Honduras",
  "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland",
  "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya",
  "Kiribati", "Kosovo", "Kuwait", "Kyrgyzstan", "Laos", "Latvia", "Lebanon",
  "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania", "Luxembourg",
  "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta",
  "Marshall Islands", "Mauritania", "Mauritius", "Mexico", "Micronesia",
  "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique",
  "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "New Zealand",
  "Nicaragua", "Niger", "Nigeria", "North Korea", "North Macedonia", "Norway",
  "Oman", "Pakistan", "Palau", "Palestine", "Panama", "Papua New Guinea",
  "Paraguay", "Peru", "Philippines", "Poland", "Portugal", "Qatar", "Romania",
  "Russia", "Rwanda", "Saint Kitts and Nevis", "Saint Lucia",
  "Saint Vincent and the Grenadines", "Samoa", "San Marino",
  "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles",
  "Sierra Leone", "Singapore", "Slovakia", "Slovenia", "Solomon Islands",
  "Somalia", "South Africa", "South Korea", "South Sudan", "Spain", "Sri Lanka",
  "Sudan", "Suriname", "Sweden", "Switzerland", "Syria", "Taiwan", "Tajikistan",
  "Tanzania", "Thailand", "Timor-Leste", "Togo", "Tonga", "Trinidad and Tobago",
  "Tunisia", "Turkey", "Turkmenistan", "Tuvalu", "Uganda", "Ukraine",
  "United Arab Emirates", "United Kingdom", "United States", "Uruguay",
  "Uzbekistan", "Vanuatu", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
]

interface StepData {
  user_type?: string
  first_name?: string
  last_name?: string
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

    const fullName = [finalData.first_name, finalData.last_name]
      .filter(Boolean)
      .join(" ") || null

    // upsert instead of update — ensures the row exists even if the
    // signup trigger failed, and won't silently skip a missing row.
    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: user.id,
      user_type: finalData.user_type ?? null,
      first_name: finalData.first_name ?? null,
      last_name: finalData.last_name ?? null,
      full_name: fullName,
      primary_goals: (finalData.primary_goals ?? null) as string[] | null,
      country: finalData.country ?? null,
      city: finalData.city ?? null,
      football_level: finalData.football_level ?? null,
      onboarding_completed: true,
      onboarding_step: 4,
    }, { onConflict: "id" })

    if (upsertError) {
      setError(upsertError.message)
      setLoading(false)
      return
    }

    // Invalidate the router cache so the middleware sees the updated profile
    router.refresh()
    router.push("/app")
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
              onNext={(v) => nextStep({ user_type: v.user_type, first_name: v.first_name, last_name: v.last_name })}
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

function Step1({ onNext }: { onNext: (v: { user_type: string; first_name: string; last_name: string }) => void }) {
  const [userType, setUserType] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")

  return (
    <div>
      <h2 className="text-white text-xl font-bold mb-1">Welcome! Tell us about yourself</h2>
      <p className="text-gray-400 text-sm mb-6">This helps us personalise your experience.</p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">First name</label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="e.g. James"
            className="w-full px-4 py-3 bg-navy text-white rounded-lg border border-gray-600 focus:outline-none focus:border-gold placeholder-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-2">Last name</label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="e.g. Smith"
            className="w-full px-4 py-3 bg-navy text-white rounded-lg border border-gray-600 focus:outline-none focus:border-gold placeholder-gray-500"
          />
        </div>
      </div>

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
        disabled={!userType || !firstName.trim() || !lastName.trim()}
        onClick={() => onNext({ user_type: userType, first_name: firstName.trim(), last_name: lastName.trim() })}
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
      <select
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        className="w-full px-4 py-3 bg-navy text-white rounded-lg border border-gray-600 focus:outline-none focus:border-gold mb-4 appearance-none"
      >
        <option value="" disabled className="text-gray-500">Select your country…</option>
        {COUNTRIES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

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
