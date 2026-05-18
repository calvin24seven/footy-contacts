import CampaignsClient from "./CampaignsClient"

export default function AdminCampaignsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Campaigns</h1>
        <p className="text-gray-400 text-sm mt-1">One-shot email campaigns to waitlist and user segments.</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Waitlist Launch</h2>
        <CampaignsClient />
      </div>
    </div>
  )
}
