// Sticky column-header row for the contact table.
// Grid template MUST match ContactRow's desktop grid exactly:
//   grid-cols-[2fr_1.4fr_1.4fr_80px_auto]
// The "Contact" label is indented to clear the 36px avatar + 12px gap.

export default function ContactTableHeader() {
  return (
    <div className="hidden md:grid grid-cols-[2fr_1.4fr_1.4fr_80px_auto] gap-x-4 items-center px-4 py-2.5 border-b border-white/[0.08] bg-navy-dark/70">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 pl-12">Contact</span>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Role</span>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Organisation</span>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Data</span>
      <span className="sr-only">Actions</span>
    </div>
  )
}
