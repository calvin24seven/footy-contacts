// Pure function — no Supabase dependency.
// Called from OnboardingShell on completion and from the dashboard
// to render personalised suggested search chips.

export interface SearchSuggestion {
  label: string
  /** Absolute path within the app, e.g. /app?q=Scout&country=United+Kingdom */
  href: string
}

// ── Lookups ───────────────────────────────────────────────────────────────────

// Maps profile.user_type → the contact roles most useful for that persona.
// Old type values (player, agent, club, scout, media, other) are included for
// backwards-compatibility with existing profiles.
const ROLES_BY_USER_TYPE: Record<string, string[]> = {
  player:     ["Scout",              "Agent",                 "Head of Recruitment", "Academy Director"],
  agent:      ["Head of Recruitment","Chief Executive",       "Technical Director",  "Club Secretary"],
  scout:      ["Head of Recruitment","Academy Director",      "Performance Director","Technical Director"],
  coach:      ["Technical Director", "Head Coach",            "Academy Director",    "Chief Executive"],
  club:       ["Scout",              "Agent",                 "Performance Director","Head of Recruitment"],
  media:      ["Press Officer",      "Media Manager",         "Communications Director","Club Secretary"],
  parent:     ["Agent",              "Scout",                 "Academy Director",    "Head of Recruitment"],
  other:      ["Scout",              "Agent",                 "Club Secretary",      "Head of Recruitment"],
}

// Maps "looking for" labels (from StepWhat) → the contact role to search for.
// Keys must exactly match the LOOKING_FOR labels defined in StepWhat.tsx.
const ROLE_BY_GOAL: Record<string, string> = {
  "Scouts":                   "Scout",
  "Agents / Representatives": "Agent",
  "Club contacts":            "Club Secretary",
  "Coaching staff":           "Head Coach",
  "Academy contacts":         "Academy Director",
  "Media / Press contacts":   "Press Officer",
  "Trials / Opportunities":   "Scout",
  "Job openings":             "Head of Recruitment",
}

const DEFAULT_ROLES = ["Scout", "Agent", "Head of Recruitment", "Academy Director"]

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generates 3–4 personalised search suggestion chips for the done screen and
 * dashboard welcome banner.
 *
 * Priority:
 *   1. Roles derived from Step 2 goals (most specific)
 *   2. Roles derived from Step 1 user type
 *   3. DEFAULT_ROLES (fallback when both are absent)
 *
 * Region label is appended when a non-"Worldwide" region is present.
 */
export function generateSuggestedSearches(
  userType: string | null | undefined,
  goals: string[] | null | undefined,
  preferredRegion: string | null | undefined,
): SearchSuggestion[] {
  const goalRoles = (goals ?? [])
    .map((g) => ROLE_BY_GOAL[g])
    .filter((r): r is string => Boolean(r))

  const typeRoles = ROLES_BY_USER_TYPE[userType ?? ""] ?? DEFAULT_ROLES

  // Merge, preserving priority order, deduplicating
  const merged = [...new Set([...goalRoles, ...typeRoles])]

  // Omit "Worldwide" — that maps to no country filter (the default)
  const region =
    preferredRegion && preferredRegion !== "Worldwide"
      ? preferredRegion
      : null

  return merged.slice(0, 4).map((role) => {
    const label = region ? `${role} · ${region}` : role
    const params = new URLSearchParams({ q: role })
    if (region) params.set("country", region)
    return { label, href: `/app?${params.toString()}` }
  })
}
