/**
 * Brand tokens for use in TypeScript/JavaScript contexts.
 * CSS custom properties in globals.css are the source of truth for styling —
 * these exports are for programmatic use (e.g. charting, canvas, inline styles).
 */

export const colors = {
  gold:        "#F9D783",
  goldDark:    "#E8C355",
  navy:        "#222C41",
  navyLight:   "#2E3A52",
  navyDark:    "#161E2E",
  // Semantic
  surface:     "#2E3A52",
  page:        "#161E2E",
  // Text
  textPrimary:   "#FFFFFF",
  textSecondary: "#9CA3AF",
  textMuted:     "#6B7280",
} as const

export const shadows = {
  sm:   "0 1px 2px 0 rgb(0 0 0 / 0.4)",
  md:   "0 4px 6px -1px rgb(0 0 0 / 0.5), 0 2px 4px -2px rgb(0 0 0 / 0.4)",
  lg:   "0 10px 15px -3px rgb(0 0 0 / 0.6), 0 4px 6px -4px rgb(0 0 0 / 0.4)",
  xl:   "0 20px 25px -5px rgb(0 0 0 / 0.6), 0 8px 10px -6px rgb(0 0 0 / 0.4)",
  gold: "0 0 0 3px rgb(249 215 131 / 0.25)",
} as const

export const transitions = {
  fast: "100ms cubic-bezier(0.4, 0, 0.2, 1)",
  base: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
} as const

export const zIndex = {
  base:     0,
  raised:   10,
  dropdown: 100,
  sticky:   200,
  overlay:  300,
  modal:    400,
  toast:    500,
  tooltip:  600,
} as const

export const gradients = {
  brand: "linear-gradient(135deg, #161E2E 0%, #222C41 50%, #1a2436 100%)",
  gold:  "linear-gradient(135deg, #F9D783 0%, #E8C355 100%)",
} as const

export const radius = {
  sm:  "0.375rem",
  md:  "0.5rem",
  lg:  "0.75rem",
  xl:  "1rem",
  "2xl": "1.5rem",
} as const
