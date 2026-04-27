import Link from "next/link"
import OpportunityForm from "../OpportunityForm"

export default function NewOpportunityPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          href="/admin/opportunities"
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          ← Opportunities
        </Link>
        <h1 className="text-2xl font-bold text-white mt-3">New Opportunity</h1>
      </div>
      <OpportunityForm />
    </div>
  )
}
