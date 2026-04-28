"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

const USER_TYPES = [
  {
    value: "player",
    label: "Player",
    desc: "Looking for clubs & opportunities",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" strokeWidth={1.5} />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 3c2.4 2.8 3 5.5 3 9s-.6 6.2-3 9M12 3c-2.4 2.8-3 5.5-3 9s.6 6.2 3 9M3 12h18" />
      </svg>
    ),
  },
  {
    value: "agent",
    label: "Agent / Manager",
    desc: "Represent & place players",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    value: "club",
    label: "Club Official",
    desc: "Recruit talent & build staff",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    value: "scout",
    label: "Scout",
    desc: "Discover & track talent",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
  {
    value: "media",
    label: "Media / Journalist",
    desc: "Cover the game & find sources",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
  },
  {
    value: "other",
    label: "Other",
    desc: "Another role in football",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
      </svg>
    ),
  },
]

const GOALS = [
  { label: "Find agents to represent me", icon: "ðŸ¤" },
  { label: "Scout players", icon: "ðŸ”­" },
  { label: "Connect with clubs", icon: "ðŸŸï¸" },
  { label: "Find coaching staff", icon: "ðŸ“‹" },
  { label: "Media & PR contacts", icon: "ðŸ“°" },
  { label: "Find opportunities", icon: "â­" },
  { label: "Build my network", icon: "ðŸŒ" },
  { label: "Research the industry", icon: "ðŸ”" },
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

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface StepData {
  user_type?: string
  first_name?: string
  last_name?: string
  primary_goals?: string[]
  country?: string
  city?: string
  football_level?: string
}

// â”€â”€ Root page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  async function complete() {
    setLoading(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const fullName = [data.first_name, data.last_name].filter(Boolean).join(" ") || null

    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: user.id,
      user_type: data.user_type ?? null,
      first_name: data.first_name ?? null,
      last_name: data.last_name ?? null,
      full_name: fullName,
      primary_goals: (data.primary_goals ?? null) as string[] | null,
      country: data.country ?? null,
      city: data.city ?? null,
      football_level: data.football_level ?? null,
      onboarding_completed: true,
      onboarding_step: 4,
    }, { onConflict: "id" })

    if (upsertError) {
      setError(upsertError.message)
      setLoading(false)
      return
    }

    router.refresh()
    router.push("/app")
  }

  const totalSteps = 4
  const STEP_LABELS = ["About you", "Your goals", "Location", "Get started"]

  return (
    <div className="min-h-screen bg-[#080c17] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-5">
        <span className="text-gold font-bold text-lg tracking-tight">Footy Contacts</span>
        <span className="text-xs text-gray-500">Step {step} of {totalSteps}</span>
      </div>

      {/* Segmented progress */}
      <div className="px-6">
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${i < step ? "bg-gold" : "bg-white/10"}`} />
          ))}
        </div>
        <div className="mt-2 flex">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className="flex-1 text-center">
              <span className={`text-[10px] font-medium transition-colors duration-300 ${
                i + 1 === step ? "text-gold" : i + 1 < step ? "text-gray-500" : "text-gray-700"
              }`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-start justify-center px-4 pt-8 pb-12">
        <div className="w-full max-w-md">
          <div className="bg-[#111827] border border-white/[0.06] rounded-2xl overflow-hidden shadow-2xl">
            {step === 1 && (
              <Step1
                onNext={(v) => nextStep({ user_type: v.user_type, first_name: v.first_name, last_name: v.last_name })}
              />
            )}
            {step === 2 && (
              <Step2 onNext={(goals) => nextStep({ primary_goals: goals })} />
            )}
            {step === 3 && (
              <Step3 onNext={(v) => nextStep({ country: v.country, city: v.city, football_level: v.football_level })} />
            )}
            {step === 4 && (
              <Step4 loading={loading} error={error} onComplete={complete} firstName={data.first_name} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// â”€â”€ Step 1: Who are you? â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Step1({
  onNext,
}: {
  onNext: (v: { user_type: string; first_name: string; last_name: string }) => void
}) {
  const [userType, setUserType] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const canContinue = userType && firstName.trim() && lastName.trim()

  return (
    <div className="p-6 sm:p-8">
      <h2 className="text-white text-xl font-bold mb-1">Welcome to Footy Contacts</h2>
      <p className="text-gray-400 text-sm mb-6">Tell us about yourself so we can personalise your experience.</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">First name</label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="James"
            className="w-full px-3.5 py-2.5 bg-white/[0.05] text-white rounded-xl border border-white/10 focus:outline-none focus:border-gold/60 placeholder-gray-600 text-sm transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Last name</label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Smith"
            className="w-full px-3.5 py-2.5 bg-white/[0.05] text-white rounded-xl border border-white/10 focus:outline-none focus:border-gold/60 placeholder-gray-600 text-sm transition-colors"
          />
        </div>
      </div>

      <label className="block text-xs font-medium text-gray-400 mb-2">I am aâ€¦</label>
      <div className="grid grid-cols-2 gap-2 mb-7">
        {USER_TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setUserType(t.value)}
            className={`group flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-150 ${
              userType === t.value
                ? "border-gold/60 bg-gold/[0.08] ring-1 ring-gold/20"
                : "border-white/10 hover:border-white/25 hover:bg-white/[0.04]"
            }`}
          >
            <span className={`mt-0.5 shrink-0 transition-colors ${userType === t.value ? "text-gold" : "text-gray-500 group-hover:text-gray-400"}`}>
              {t.icon}
            </span>
            <div className="min-w-0">
              <p className={`text-sm font-semibold leading-tight transition-colors ${userType === t.value ? "text-gold" : "text-gray-200"}`}>
                {t.label}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{t.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <button
        disabled={!canContinue}
        onClick={() => onNext({ user_type: userType, first_name: firstName.trim(), last_name: lastName.trim() })}
        className="w-full py-3 bg-gold text-[#080c17] rounded-xl font-bold text-sm hover:bg-yellow-400 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  )
}

// â”€â”€ Step 2: What are you looking for? â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Step2({ onNext }: { onNext: (goals: string[]) => void }) {
  const [selected, setSelected] = useState<string[]>([])

  function toggle(goal: string) {
    setSelected((prev) => prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal])
  }

  return (
    <div className="p-6 sm:p-8">
      <h2 className="text-white text-xl font-bold mb-1">What are your main goals?</h2>
      <p className="text-gray-400 text-sm mb-6">Select everything that applies â€” we&apos;ll tailor your feed.</p>

      <div className="grid grid-cols-1 gap-2 mb-7">
        {GOALS.map((goal) => {
          const active = selected.includes(goal.label)
          return (
            <button
              key={goal.label}
              type="button"
              onClick={() => toggle(goal.label)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150 ${
                active
                  ? "border-gold/60 bg-gold/[0.08] ring-1 ring-gold/20"
                  : "border-white/10 hover:border-white/25 hover:bg-white/[0.04]"
              }`}
            >
              <span className="text-base shrink-0">{goal.icon}</span>
              <span className={`text-sm font-medium flex-1 transition-colors ${active ? "text-gold" : "text-gray-200"}`}>
                {goal.label}
              </span>
              {active && (
                <svg className="w-4 h-4 text-gold shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          )
        })}
      </div>

      <button
        disabled={selected.length === 0}
        onClick={() => onNext(selected)}
        className="w-full py-3 bg-gold text-[#080c17] rounded-xl font-bold text-sm hover:bg-yellow-400 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  )
}

// â”€â”€ Step 3: Where are you based? â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Step3({
  onNext,
}: {
  onNext: (v: { country: string; city: string; football_level: string }) => void
}) {
  const [country, setCountry] = useState("")
  const [city, setCity] = useState("")
  const [level, setLevel] = useState("")

  return (
    <div className="p-6 sm:p-8">
      <h2 className="text-white text-xl font-bold mb-1">Where are you based?</h2>
      <p className="text-gray-400 text-sm mb-6">Helps us surface the most relevant contacts for you.</p>

      <div className="space-y-4 mb-7">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">Country</label>
          <div className="relative">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/[0.05] text-white rounded-xl border border-white/10 focus:outline-none focus:border-gold/60 appearance-none text-sm transition-colors cursor-pointer"
            >
              <option value="" disabled className="bg-[#111827] text-gray-500">Select your countryâ€¦</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c} className="bg-[#111827]">{c}</option>
              ))}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">
            City <span className="text-gray-600 font-normal">(optional)</span>
          </label>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g. Manchester"
            className="w-full px-3.5 py-2.5 bg-white/[0.05] text-white rounded-xl border border-white/10 focus:outline-none focus:border-gold/60 placeholder-gray-600 text-sm transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Football level <span className="text-gray-600 font-normal">(optional)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(level === l ? "" : l)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  level === l
                    ? "border-gold/60 bg-gold/[0.08] text-gold"
                    : "border-white/10 text-gray-400 hover:border-white/25"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        disabled={!country.trim()}
        onClick={() => onNext({ country: country.trim(), city: city.trim(), football_level: level })}
        className="w-full py-3 bg-gold text-[#080c17] rounded-xl font-bold text-sm hover:bg-yellow-400 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  )
}

// â”€â”€ Step 4: You're in â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Step4({
  loading,
  error,
  onComplete,
  firstName,
}: {
  loading: boolean
  error: string | null
  onComplete: () => void
  firstName?: string
}) {
  return (
    <div className="p-6 sm:p-8">
      <div className="text-center mb-7">
        <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
        <h2 className="text-white text-xl font-bold mb-1">
          {firstName ? `You're all set, ${firstName}!` : "You're all set!"}
        </h2>
        <p className="text-gray-400 text-sm">
          Your profile is ready. Start exploring the world&apos;s largest football contact database.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        {[
          { value: "27,578", label: "Contacts" },
          { value: "114", label: "Countries" },
          { value: "84%", label: "Have phone" },
        ].map(({ value, label }) => (
          <div key={label} className="bg-white/[0.04] border border-white/[0.06] rounded-xl py-3 text-center">
            <p className="text-gold font-bold text-lg leading-tight">{value}</p>
            <p className="text-gray-500 text-[11px] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-start gap-3 bg-gold/[0.06] border border-gold/20 rounded-xl p-4 mb-6">
        <svg className="w-5 h-5 text-gold shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        <div>
          <p className="text-gold font-semibold text-sm">You have 1 free unlock</p>
          <p className="text-gray-400 text-xs mt-0.5">
            Use it to reveal email, phone, and LinkedIn for any contact in our database.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-700/40 rounded-xl px-4 py-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <button
        disabled={loading}
        onClick={onComplete}
        className="w-full py-3.5 bg-gold text-[#080c17] rounded-xl font-bold text-sm hover:bg-yellow-400 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Setting up your account…
          </>
        ) : (
          <>
            Start searching
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </>
        )}
      </button>
    </div>
  )
}
