import TeamClient from "./TeamClient"

export const metadata = { title: "Team · Footy Contacts" }

export default function TeamPage() {
  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-4">
      <div>
        <h1 className="text-white text-2xl font-bold">Team</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage your Agency team members and seat allocation.
        </p>
      </div>
      <TeamClient />
    </div>
  )
}
