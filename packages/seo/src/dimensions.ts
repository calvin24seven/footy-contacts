/** Converts any label string to a URL-safe slug. */
export function toSlug(label: string): string {
  return label
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}

/** Recovers a display label from a slug (capitalises each word). */
export function fromSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}

/**
 * Canonical category slug → display label mapping.
 * Keys are URL slugs; values are human-readable labels used in headings/metadata.
 * Extend this map as new categories are added to the database.
 */
export const CATEGORY_LABELS: Record<string, string> = {
  scouts: "Scouts",
  agents: "Agents",
  coaches: "Coaches",
  "club-officials": "Club Officials",
  "academy-staff": "Academy Staff",
  media: "Media",
  analysts: "Analysts",
  physiotherapists: "Physiotherapists",
  "sporting-directors": "Sporting Directors",
  "commercial-staff": "Commercial Staff",
  recruiters: "Recruiters",
  managers: "Managers",
  "youth-coaches": "Youth Coaches",
  "technical-directors": "Technical Directors",
  "performance-staff": "Performance Staff",
}

export type CategorySlug = keyof typeof CATEGORY_LABELS

export function getCategoryLabel(slug: string): string {
  return CATEGORY_LABELS[slug] ?? fromSlug(slug)
}
