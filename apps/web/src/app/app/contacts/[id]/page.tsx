import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import UnlockButton from "./UnlockButton"
import SaveToListButton from "@/components/SaveToListButton"
import { getOrgLogoUrl } from "@/lib/orgLogo"

export default async function ContactPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: contact } = await supabase
    .from("contacts")
    .select("*, organisations(logo_url, domain)")
    .eq("id", id)
    .eq("visibility_status", "published")
    .single()

  if (!contact) notFound()

  const orgLogoUrl = getOrgLogoUrl(contact.organisations as { logo_url: string | null; domain: string | null } | null)

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
    <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-24 md:pb-6">
      {/* Back */}
      <a href="/app" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-4">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to search
      </a>

      <div className="bg-navy-light rounded-xl p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center shrink-0 overflow-hidden
            bg-gold/20 text-gold text-xl sm:text-2xl font-bold">
            {orgLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={orgLogoUrl}
                alt={contact.organisation ?? ""}
                className="w-full h-full object-contain p-1.5 bg-white/5"
                onError={(e) => { e.currentTarget.style.display = "none" }}
              />
            ) : (
              contact.name[0]?.toUpperCase()
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-white text-lg sm:text-2xl font-bold leading-tight">{contact.name}</h1>
              {contact.verified_status === "verified" && (
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded shrink-0">
                  Verified
                </span>
              )}
            </div>
            {contact.role && (
              <p className="text-gold font-medium text-sm mt-0.5">{contact.role}</p>
            )}
            {contact.organisation && (
              <p className="text-gray-300 text-sm">{contact.organisation}</p>
            )}
            <p className="text-gray-400 text-xs mt-1">
              {[contact.city, contact.country].filter(Boolean).join(", ")}
            </p>
            {user && (
              <div className="mt-3">
                <SaveToListButton contactId={id} />
              </div>
            )}
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
                <ContactDetail
                  label="Email"
                  icon="email"
                  value={contact.email}
                  href={`mailto:${contact.email}`}
                />
              )}
              {contact.phone && (
                <ContactDetail
                  label="Phone"
                  icon="phone"
                  value={contact.phone}
                  href={`tel:${contact.phone}`}
                />
              )}
              {contact.linkedin_url && (
                <ContactDetail
                  label="LinkedIn"
                  icon="linkedin"
                  value="View profile"
                  href={contact.linkedin_url}
                  external
                />
              )}
              {contact.website && (
                <ContactDetail
                  label="Website"
                  icon="globe"
                  value="Visit website"
                  href={contact.website}
                  external
                />
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
  icon,
  value,
  href,
  external,
}: {
  label: string
  icon: "email" | "phone" | "linkedin" | "globe"
  value: string
  href: string
  external?: boolean
}) {
  const icons = {
    email: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    phone: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    linkedin: (
      <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    globe: (
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
  }

  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-700/50 last:border-0 gap-4">
      <div className="flex items-center gap-2.5 text-gray-400 shrink-0">
        {icons[icon]}
        <span className="text-sm">{label}</span>
      </div>
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className="text-gold text-sm hover:underline truncate min-w-0"
      >
        {value}
      </a>
    </div>
  )
}
