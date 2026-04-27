import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function SuspendedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  async function signOut() {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-4">⛔</div>
        <h1 className="text-white text-2xl font-bold mb-3">Account Suspended</h1>
        <p className="text-gray-300 mb-2">
          Your account has been suspended and you cannot access Footy Contacts at this time.
        </p>
        {profile?.suspended_reason && (
          <p className="text-gray-400 text-sm bg-navy-light rounded-lg px-4 py-3 mb-6">
            Reason: {profile.suspended_reason}
          </p>
        )}
        <p className="text-gray-400 text-sm mb-6">
          If you believe this is a mistake, please contact{" "}
          <a href="mailto:support@footycontacts.com" className="text-gold hover:underline">
            support@footycontacts.com
          </a>
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}
