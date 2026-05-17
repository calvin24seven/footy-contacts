import { Suspense } from "react"
import AdminContactsClient from "./AdminContactsClient"

export default function AdminContactsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">Loading contacts…</div>}>
      <AdminContactsClient />
    </Suspense>
  )
}
