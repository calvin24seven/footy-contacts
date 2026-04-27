import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import UnlockButton from "./UnlockButton"
import SaveToListButton from "@/components/SaveToListButton"
import type { Tables } from "@/database.types"

export default async function ContactPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("visibility_status", "published")
    .single()

  if (!contact) notFound()

  const { data: { user } } = await supabase.auth.getUser()

  // Check if already unlocked
  let isUnlocked = false
  if (user) {
    const { data: unlock } = await supabase
      .from("contact_unlocks")
      .select("id")
      .eq("user_id", user.id)
      .eq("contact_id", id)
      .maybeSingle()
    isUnlocked = !!unlock
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-navy-light rounded-xl p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center text-gold text-2xl font-bold shrink-0">
            {contact.name[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-white text-2xl font-bold">{contact.name}</h1>
                  {contact.verified_status === "verified" && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
                      Verified
                    </span>
                  )}
                </div>
                {contact.role && (
                  <p className="text-gold font-medium">{contact.role}</p>
                )}
                {contact.organisation && (
                  <p className="text-gray-300">{contact.organisation}</p>
                )}
                <p className="text-gray-400 text-sm mt-1">
                  {[contact.city, contact.country].filter(Boolean).join(", ")}
                </p>
              </div>
              {user && <SaveToListButton contactId={id} />}
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {contact.category && (
            <MetaItem label="Category" value={contact.category} />
          )}
          {contact.level && <MetaItem label="Level" value={contact.level} />}
          {contact.region && <MetaItem label="Region" value={contact.region} />}
        </div>

        {/* Contact details — gated */}
        <div className="border-t border-gray-700 pt-6">
          <h2 className="text-white font-semibold mb-4">Contact Details</h2>
          {isUnlocked ? (
            <div className="space-y-3">
              {contact.email && (
                <ContactDetail label="Email" value={contact.email} href={`mailto:${contact.email}`} />
              )}
              {contact.phone && (
                <ContactDetail label="Phone" value={contact.phone} href={`tel:${contact.phone}`} />
              )}
              {contact.linkedin_url && (
                <ContactDetail label="LinkedIn" value="View profile" href={contact.linkedin_url} external />
              )}
              {contact.website && (
                <ContactDetail label="Website" value={contact.website} href={contact.website} external />
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-400 text-sm mb-4">
                Unlock this contact to view email, phone and social profiles
              </p>
              <UnlockButton contactId={id} />
            </div>
          )}
        </div>

        {contact.tags && contact.tags.length > 0 && (
          <div className="border-t border-gray-700 pt-4 mt-4">
            <div className="flex flex-wrap gap-2">
              {contact.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-navy text-gray-300 px-2 py-1 rounded"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#222C41] rounded-lg p-3">
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-white text-sm">{value}</p>
    </div>
  )
}

function ContactDetail({
  label,
  value,
  href,
  external,
}: {
  label: string
  value: string
  href: string
  external?: boolean
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-700/50 last:border-0">
      <span className="text-sm text-gray-400">{label}</span>
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="text-gold text-sm hover:underline"
      >
        {value}
      </a>
    </div>
  )
}
