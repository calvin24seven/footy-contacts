import { z } from "zod"
import type { Tables } from "@footy/supabase"

// ─── DB Row types ────────────────────────────────────────────────────────────
export type Profile = Tables<"profiles">
export type Contact = Tables<"contacts">
export type Plan = Tables<"plans">
export type Subscription = Tables<"subscriptions">
export type ContactUnlock = Tables<"contact_unlocks">
export type List = Tables<"lists">
export type Opportunity = Tables<"opportunities">
export type SavedSearch = Tables<"saved_searches">
export type SubscriptionUsagePeriod = Tables<"subscription_usage_periods">

// ─── Derived / convenience types ─────────────────────────────────────────────
export type UserRole = "user" | "admin"

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "incomplete"
  | "paused"

export type PlanCode = "free" | "starter" | "pro" | "agency"

export type ContactVerifiedStatus = "unverified" | "verified" | "stale"

export type ContactVisibilityStatus = "published" | "hidden" | "pending_review"

// ─── Auth session payload ────────────────────────────────────────────────────
export interface AppUser {
  id: string
  email: string
  profile: Profile
}

// ─── Access check result ─────────────────────────────────────────────────────
export interface AccessResult {
  canUnlock: boolean
  canExport: boolean
  unlocksUsed: number
  unlocksLimit: number
  exportsUsed: number
  exportsLimit: number
  planCode: PlanCode
}

// ─── Search ──────────────────────────────────────────────────────────────────
export interface SearchFilters {
  query?: string
  category?: string
  country?: string
  city?: string
  level?: string
  organisation?: string
  tags?: string[]
}

// ─── Zod schemas ─────────────────────────────────────────────────────────────
export const searchFiltersSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  level: z.string().optional(),
  organisation: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export const onboardingStep1Schema = z.object({
  user_type: z.enum(["player", "agent", "club", "scout", "media", "other"]),
  full_name: z.string().min(2, "Full name required"),
})

export const onboardingStep2Schema = z.object({
  primary_goals: z.array(z.string()).min(1, "Select at least one goal"),
})

export const onboardingStep3Schema = z.object({
  country: z.string().min(1, "Country required"),
  city: z.string().optional(),
  football_level: z.string().optional(),
})

export const onboardingStep4Schema = z.object({
  position: z.string().optional(),
  player_age_group: z.string().optional(),
  current_club: z.string().optional(),
  open_to_opportunities: z.enum(["yes", "no", "open"]).optional(),
})
