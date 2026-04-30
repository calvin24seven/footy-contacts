import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ProfileForm from "./ProfileForm"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, first_name, last_name, username, avatar_url, user_type, country, city, football_level, position, current_club, player_age_group, open_to_opportunities, highlight_video_url, email")
    .eq("id", user.id)
    .single()

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-1">Profile</h1>
      <p className="text-gray-400 text-sm mb-8">Update your personal information</p>
      <ProfileForm profile={profile} userEmail={user.email ?? ""} />
    </div>
  )
}
