"use client"

import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function LogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <button
      onClick={handleLogout}
      title="Sign out"
      className="ml-auto shrink-0 text-gray-500 hover:text-red-400 transition-colors p-1 rounded"
      aria-label="Sign out"
    >
      {/* Arrow-right-from-bracket (logout icon) */}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
      </svg>
    </button>
  )
}
