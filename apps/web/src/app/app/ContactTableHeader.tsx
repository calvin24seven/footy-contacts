"use client"

// Sticky column-header row for the contact table.
// Grid template MUST match ContactRow's desktop grid exactly:
//   grid-cols-[32px_minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_90px_120px]

export default function ContactTableHeader({
  allSelected,
  someSelected,
  onToggleAll,
}: {
  allSelected: boolean
  someSelected: boolean
  onToggleAll: () => void
}) {
  return (
    <div className="hidden md:grid grid-cols-[32px_minmax(0,2fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_90px_120px] gap-x-4 items-center px-4 py-2.5 border-b border-white/[0.08] bg-navy-dark/70">
      <div onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={allSelected}
          ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected }}
          onChange={onToggleAll}
          className="w-3.5 h-3.5 rounded accent-gold cursor-pointer"
          aria-label="Select all"
        />
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Contact</span>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Role</span>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Organisation</span>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Data</span>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</span>
    </div>
  )
}
