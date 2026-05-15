"use client"

import { useState, useCallback } from "react"
import ContactRow, { type ContactListRow } from "./ContactRow"
import ContactTableHeader from "./ContactTableHeader"
import ContactPreview from "./ContactPreview"

export default function ContactsList({ contacts }: { contacts: ContactListRow[] }) {
  const [previewContact, setPreviewContact] = useState<ContactListRow | null>(null)

  const handlePreview = useCallback((contact: ContactListRow) => {
    setPreviewContact((prev) => (prev?.id === contact.id ? null : contact))
  }, [])

  const handleClose = useCallback(() => setPreviewContact(null), [])

  return (
    <>
      <div className="flex gap-4 items-start">
        {/* Results list wrapped in a bordered table container */}
        <div className={`min-w-0 ${previewContact ? "flex-1" : "w-full"}`}>
          <div className="border border-white/[0.06] rounded-xl overflow-hidden">
            <ContactTableHeader />
            <div>
              {contacts.map((contact) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  onPreview={handlePreview}
                  isSelected={previewContact?.id === contact.id}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Desktop side panel — hidden on mobile (mobile uses fixed overlay below) */}
        {previewContact && (
          <aside className="hidden lg:block w-[340px] xl:w-[360px] shrink-0 sticky top-36 self-start">
            <ContactPreview
              key={previewContact.id}
              contact={previewContact}
              onClose={handleClose}
              desktopMode
            />
          </aside>
        )}
      </div>

      {/* Mobile / tablet fixed overlay */}
      {previewContact && (
        <div className="lg:hidden">
          <ContactPreview
            key={`mobile-${previewContact.id}`}
            contact={previewContact}
            onClose={handleClose}
          />
        </div>
      )}
    </>
  )
}
