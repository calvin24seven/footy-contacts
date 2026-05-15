"use client"

import { useState, useCallback } from "react"
import ContactRow, { type ContactListRow } from "./ContactRow"
import ContactTableHeader from "./ContactTableHeader"
import ContactPreview from "./ContactPreview"

export default function ContactsList({ contacts }: { contacts: ContactListRow[] }) {
  const [previewContact, setPreviewContact] = useState<ContactListRow | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const handlePreview = useCallback((contact: ContactListRow) => {
    setPreviewContact((prev) => (prev?.id === contact.id ? null : contact))
  }, [])

  const handleClose = useCallback(() => setPreviewContact(null), [])

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) =>
      prev.size === contacts.length ? new Set() : new Set(contacts.map((c) => c.id))
    )
  }, [contacts])

  const allSelected = contacts.length > 0 && selectedIds.size === contacts.length
  const someSelected = selectedIds.size > 0 && selectedIds.size < contacts.length

  return (
    <>
      <div className="flex gap-4 items-start">
        {/* Results list wrapped in a bordered table container */}
        <div className={`min-w-0 ${previewContact ? "flex-1" : "w-full"}`}>
          <div className="border border-white/[0.06] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-[780px]">
                <ContactTableHeader allSelected={allSelected} someSelected={someSelected} onToggleAll={toggleAll} />
                <div>
                  {contacts.map((contact) => (
                    <ContactRow
                      key={contact.id}
                      contact={contact}
                      onPreview={handlePreview}
                      isSelected={previewContact?.id === contact.id}
                      selected={selectedIds.has(contact.id)}
                      onToggle={toggleSelected}
                    />
                  ))}
                </div>
              </div>
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
