#!/usr/bin/env node
/**
 * One-time script: queue the waitlist-launch email for all unsuppressed
 * waitlist subscribers.
 *
 * Usage (from repo root):
 *   node --env-file=apps/web/.env.local scripts/send-waitlist-launch.mjs
 *
 * Or with explicit env vars:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... UNSUBSCRIBE_SECRET=... \
 *     node scripts/send-waitlist-launch.mjs
 *
 * Add --dry-run to preview without inserting jobs.
 */

import { createHmac } from "crypto"

const DRY_RUN     = process.argv.includes("--dry-run")
const APP_URL     = "https://footycontacts.com"
const CAMPAIGN_ID = "waitlist-launch-2026"
const TEMPLATE_ID = "waitlist-launch"

// ── Validate env ────────────────────────────────────────────────────────────
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !UNSUBSCRIBE_SECRET) {
  console.error("❌  Missing required env vars:")
  if (!SUPABASE_URL)        console.error("   NEXT_PUBLIC_SUPABASE_URL")
  if (!SERVICE_ROLE_KEY)    console.error("   SUPABASE_SERVICE_ROLE_KEY")
  if (!UNSUBSCRIBE_SECRET)  console.error("   UNSUBSCRIBE_SECRET")
  process.exit(1)
}

// ── Supabase REST helpers (no SDK — runs anywhere node is available) ─────────
const REST_URL = `${SUPABASE_URL}/rest/v1`
const HEADERS  = {
  "apikey":        SERVICE_ROLE_KEY,
  "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type":  "application/json",
  "Prefer":        "return=representation",
}

async function pgSelect(table, params = "") {
  const res = await fetch(`${REST_URL}/${table}?${params}`, { headers: HEADERS })
  if (!res.ok) throw new Error(`SELECT ${table} failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function pgUpsert(table, rows, onConflict) {
  const res = await fetch(`${REST_URL}/${table}`, {
    method:  "POST",
    headers: { ...HEADERS, "Prefer": `resolution=ignore-duplicates,return=minimal` },
    body:    JSON.stringify(rows),
  })
  if (!res.ok) throw new Error(`UPSERT ${table} failed: ${res.status} ${await res.text()}`)
}

function createUnsubscribeToken(email, category) {
  return createHmac("sha256", UNSUBSCRIBE_SECRET)
    .update(`${email.toLowerCase()}:${category}`)
    .digest("hex")
}

// ── Fetch waitlist ───────────────────────────────────────────────────────────
console.log("Fetching waitlist…")
const waitlist = await pgSelect("waitlist", "select=id,email")
console.log(`   ${waitlist.length} waitlist entries found`)

// ── Filter suppressions ──────────────────────────────────────────────────────
const emailList = waitlist.map((r) => r.email.toLowerCase().trim()).join(",")
const suppressions = await pgSelect(
  "email_suppressions",
  `select=email&email=in.(${emailList})&category=in.(marketing,all)`,
)

const suppressedSet = new Set((suppressions ?? []).map((s) => s.email.toLowerCase()))
const sendable = waitlist.filter((r) => !suppressedSet.has(r.email.toLowerCase().trim()))

console.log(`   ${suppressedSet.size} suppressed, ${sendable.length} sendable`)

if (sendable.length === 0) {
  console.log("✅  Nothing to send.")
  process.exit(0)
}

// ── Build email_jobs ─────────────────────────────────────────────────────────
const now  = new Date().toISOString()
const jobs = sendable.map((row) => {
  const email      = row.email.toLowerCase().trim()
  const token      = createUnsubscribeToken(email, "marketing")
  const unsubUrl   = `${APP_URL}/unsubscribe?email=${encodeURIComponent(email)}&category=marketing&token=${token}`

  return {
    idempotency_key: `${CAMPAIGN_ID}:${row.id}`,
    to_email:        email,
    to_name:         null,
    reply_to:        "hello@footycontacts.com",
    template_id:     TEMPLATE_ID,
    template_props:  { unsubscribeUrl: unsubUrl },
    category:        "marketing",
    user_id:         null,
    max_attempts:    3,
    next_retry_at:   now,
  }
})

if (DRY_RUN) {
  console.log("\n🔍  DRY RUN — jobs that would be queued:")
  jobs.forEach((j) => console.log(`   ${j.to_email}  (key: ${j.idempotency_key})`))
  console.log(`\n✅  Dry run complete. ${jobs.length} jobs would be queued.`)
  process.exit(0)
}

// ── Insert jobs ──────────────────────────────────────────────────────────────
console.log(`\nInserting ${jobs.length} email_jobs…`)
await pgUpsert("email_jobs", jobs, "idempotency_key")

console.log(`✅  ${jobs.length} waitlist-launch emails queued.`)
console.log("   The email-drain cron will deliver them on its next run.")
console.log("   Or trigger immediately:")
console.log("   GET /api/cron/email-drain  (Authorization: Bearer <CRON_SECRET>)")
