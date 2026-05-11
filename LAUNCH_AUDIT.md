# Footy Contacts — MVP Launch-Readiness Audit

**Date:** 2025-05-20  
**Auditor:** GitHub Copilot (automated, via static code analysis + live MCP database inspection)  
**Scope:** Full-stack audit — Next.js frontend, API routes, Supabase PostgreSQL (RLS, functions, grants), Stripe integration, infrastructure

> **Method:** All database findings were verified live via Supabase MCP queries (not assumed from migrations alone). Discrepancies between migration files and live DB are explicitly called out.

---

## 1. Executive Summary

Footy Contacts is a commercially viable sports-industry contact directory SaaS with solid foundational architecture. The codebase has strong patterns in most areas: proper SSR auth, well-designed subscription billing, a capable export pipeline, and meaningful admin tooling. However, **two critical, independently-exploitable security vulnerabilities must be fixed before accepting payment from users.**

The most severe issue is a **database-level data exposure flaw** in the `contacts` table: the `authenticated` Postgres role has unrestricted SELECT grants on `email`, `phone`, `linkedin_url`, `instagram_url`, and `x_url` columns, with a row-level policy that allows any authenticated user to read every published contact row. This means any user who creates a free account can bypass the entire unlock/subscription system by calling the PostgREST API directly with their session JWT — extracting the full contact database (12,292 records) without paying.

The second critical issue is that `increment_bonus_credits`, a SECURITY DEFINER function callable by any authenticated user via the RPC API, contains no internal auth check — allowing any free user to grant themselves or any other user an arbitrary number of bonus unlock credits.

Additionally, two complete backend systems from the codebase migrations — the scraper detection system and the honeypot contact system — have **never been applied to the live database**. The database is running unprotected against automated scraping.

**Verdict: Do not accept live payments until blockers #1–#3 are resolved.**

---

## 2. Current Architecture Findings

### Stack (verified)
| Layer | Technology | Status |
|---|---|---|
| Frontend | Next.js 15 App Router, React Server Components | Deployed on Vercel |
| Auth | Supabase Auth (JWT, SSR cookie sessions) | Working |
| Database | Supabase PostgreSQL + RLS | 26 tables, all RLS enabled |
| Payments | Stripe (webhooks, checkout, portal) | Working |
| Rate limiting | Upstash Redis (distributed) | Fail-open (see §3) |
| Email verification | Reoon API (bulk, cron) | Working but no provider |
| Scraper protection | pg_cron + behavioural detection | NOT DEPLOYED (see §3) |
| Monorepo | pnpm Turbo (`packages/hooks`, `packages/supabase`, `packages/types`) | Working |

### Live Database State (verified via MCP)
| Metric | Count |
|---|---|
| Total contacts | 38,927 |
| Published contacts | 12,292 |
| Total unlocks | 0 |
| Active subscriptions | 1 |
| Total registered users | 598 |
| Email suppressions | 5,733 |

### Plans (verified via MCP)
| Plan | Price | Unlocks/mo | Exports/mo | Active? |
|---|---|---|---|---|
| Free | £0 | 3 (RPC-enforced) | 0 | Yes |
| Pro | £39/mo | 150 | 75 | Yes |
| Pro (legacy) | £79/mo | 250 | 150 | No |
| Agency | £149/mo | Unlimited | 500 | Yes |

### Migration vs Live DB Discrepancies
| Migration File | Expected Effect | Live DB Status |
|---|---|---|
| `20260501_honeypot_contacts.sql` | Creates `is_honeypot` column, `contacts_safe` view, 20 honeypot contacts, trigger | **NOT APPLIED** — `is_honeypot` column does not exist |
| `20260501_scraper_detection.sql` | Creates `contact_views` table, `scraper_flags` table, pg_cron jobs | **NOT APPLIED** — tables do not exist |
| All other migrations | Schema, indexes, RLS policies | Applied correctly |

---

## 3. Security Audit

### CRITICAL Severity

---

#### SEC-01 — Database-Level Exposure of Premium Fields (Email/Phone/Social)
**Severity:** CRITICAL — Launch Blocker  
**Location:** `contacts` table, column grants, `apps/web/src/app/app/contacts/[id]/page.tsx`

**Finding (verified via MCP):**  
The `authenticated` Postgres role has unrestricted SELECT grants on `email`, `phone`, `linkedin_url`, `instagram_url`, and `x_url` columns. The contacts RLS SELECT policy is:

```sql
-- auth.role() = 'authenticated' AND visibility_status = 'published' AND suppression_status = 'active'
```

This means **any authenticated user (including free-tier users) can make a direct PostgREST API call** with their session JWT and the publicly-visible anon key to extract all 12,292 published contact emails and phone numbers in a single request:

```
GET https://[project].supabase.co/rest/v1/contacts?select=email,phone,linkedin_url&visibility_status=eq.published
Authorization: Bearer <user_jwt>
apikey: <anon_key_from_browser>
```

The unlock system is enforced **only at the application layer** (React render gates, API route logic). The entire commercial proposition of the platform — selling access to contact details — is fully bypassable by anyone with a free account and 5 minutes.

Additionally, even on the contact detail page, the server component issues `SELECT *` including all premium fields regardless of unlock status, then conditionally renders them. This is a secondary concern given the primary API bypass above.

**The `anon` role also has SELECT grants on these columns** (verified via MCP column_privileges query). This means if the `authenticated` RLS policy ever has a bug, unauthenticated users could also access premium fields.

**Fix:**
1. Revoke SELECT on `email`, `phone`, `linkedin_url`, `instagram_url`, `x_url` from both `authenticated` and `anon` roles at the column level.
2. Serve these fields only via `createAdminClient()` (service role) on the server, **after** verifying the user has unlocked that specific contact via `contact_unlocks`.
3. Update contact detail page to use a column projection query that excludes premium fields, then separately fetches gated fields server-side via admin client when `isUnlocked = true`.

---

#### SEC-02 — `increment_bonus_credits` RPC Has No Auth Check
**Severity:** CRITICAL — Launch Blocker  
**Location:** `public.increment_bonus_credits()` (verified via MCP `pg_proc` query)

**Finding (verified via MCP):**  
The function definition is:
```sql
CREATE OR REPLACE FUNCTION public.increment_bonus_credits(p_user_id uuid, p_amount integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  UPDATE profiles
  SET bonus_unlock_credits = GREATEST(0, bonus_unlock_credits + p_amount)
  WHERE id = p_user_id;
END;
$$;
```

No `auth.uid()` check. No admin check. Any authenticated user can call:
```
POST /rest/v1/rpc/increment_bonus_credits
{"p_user_id": "<any_user_uuid>", "p_amount": 9999}
```
This grants unlimited bonus unlock credits to any user — including the calling user themselves. The API route (`/api/admin/users/[userId]`) that invokes this does check admin role, but the underlying RPC is independently callable.

**Fix:** Add an auth check at the start of the function body:
```sql
IF auth.role() != 'service_role' AND NOT is_admin() THEN
  RAISE EXCEPTION 'Access denied';
END IF;
```

---

#### SEC-03 — Scraper Detection and Honeypot Systems Not Deployed
**Severity:** CRITICAL — Launch Blocker  
**Location:** `supabase/migrations/20260501_honeypot_contacts.sql`, `supabase/migrations/20260501_scraper_detection.sql`

**Finding (verified via MCP):**  
The migrations for both the honeypot contact system and the behavioural scraper detection system have never been applied to the live database:
- `is_honeypot` column does not exist on `contacts`
- `contact_views` table does not exist  
- `scraper_flags` table does not exist
- `contacts_safe` view does not exist
- pg_cron scraper detection jobs do not exist (only `check-credit-resets` and `process-credit-resets-daily` are active)

The platform has 38,927 contacts, 12,292 published. Without scraper detection, automated bulk harvesting can occur with no velocity detection, no auto-suspension, and no honeypot traps. This is especially critical given finding SEC-01 above (which would already be the preferred scrape vector, but if SEC-01 is fixed, scraping via normal unlock flow still needs detection).

**Fix:** Apply both migrations to the live database.

---

### HIGH Severity

---

#### SEC-04 — 25+ Legacy Functions with Mutable `search_path`
**Severity:** HIGH  
**Location:** Multiple functions in `public` schema (verified via Supabase Security Advisor)

**Finding (verified via MCP `get_advisors`):**  
The following functions have `SECURITY DEFINER` without `SET search_path TO 'public'`:
`update_updated_at_column`, `check_login_attempts`, `restore_contact_list`, `is_contact_email_visible`, `force_logout_other_sessions`, `update_updated_at_timestamp`, `save_contact_with_credits`, `calculate_prorated_credits`, `handle_subscription_upgrade`, `insert_saved_contact_without_credit_check`, `handle_subscription_credit_reset`, `check_user_limits`, `get_public_profile_fields`, `text_similarity`, `is_org_member`, `is_org_owner`, `update_contact_search_vector`, `app_auth.check_email_exists`, `check_index_exists`, `handle_subscription_downgrade`, `handle_subscription_dispute`, `health_email_status_breakdown`, `health_weekly_growth`, `handle_credit_suspension`, `handle_subscription_refund`

A `search_path` injection attack: if a malicious user can create objects in a schema that appears before `public` in the search_path, the SECURITY DEFINER function will execute attacker-controlled code with elevated privileges.

**Fix:** Add `SET search_path TO 'public', 'pg_catalog'` to each affected function.

---

#### SEC-05 — Rate Limiter Fail-Open
**Severity:** HIGH  
**Location:** `apps/web/src/lib/rate-limit.ts`

**Finding (verified via code):**
```typescript
// If Redis is unavailable, initialisation returns null
if (!r) return { allowed: true, remaining: limit, reset: 0 };
// On Redis error during check
return { allowed: true, remaining: limit, reset: 0 };
```

If Upstash Redis is unavailable (outage, misconfiguration, key rotation), all rate limits — including unlock (20/min, 200/day) and export (1/hour) — are silently bypassed. A Redis outage combined with SEC-01 above is catastrophic.

**Fix:** Change to fail-closed for the export endpoint at minimum. For unlocks, a database-backed fallback counter is preferable. At minimum, log and alert on Redis unavailability.

---

#### SEC-06 — `payment_failed` Does Not Revoke Access
**Severity:** HIGH  
**Location:** `apps/web/src/app/api/stripe/webhook/route.ts`

**Finding (verified via code):**  
When Stripe fires `invoice.payment_failed`, the webhook sets `status = 'past_due'` in the `subscriptions` table. The `unlock_contact` RPC checks `status IN ('active', 'trialing')` — so a `past_due` user **cannot unlock new contacts**. However, there is no grace period enforcement and no escalation path: users remain `past_due` indefinitely with access to previously unlocked contacts and the full search without page-1 restriction (the search page checks subscription status client-side via `useSubscription` hook).

The `useSubscription` hook reads from `subscriptions` directly and doesn't filter on `past_due`, so `past_due` users may see unrestricted search in the UI depending on the hook's logic.

**Fix:** Define a grace period (e.g., 7 days), then downgrade `past_due` to `free` access after that period. Add a cron job or webhook on `invoice.payment_failed` that schedules the downgrade.

---

#### SEC-07 — No Email Provider
**Severity:** HIGH — Launch Blocker for Reactivation Campaign  
**Location:** Entire codebase

**Finding (verified via MCP and code):**  
No email sending infrastructure exists anywhere in the codebase or database. No Resend, SendGrid, Mailgun, SES, or similar provider is configured. The Reoon integration is for **email verification** only (checking if addresses are deliverable), not for sending email. Verified via:
- No email-sending functions in Supabase (MCP `routines` query)
- No email provider SDK in `package.json` files
- No API routes that compose or send email
- No email templates anywhere in the project

This means:
- No welcome email to new signups
- No password reset email (Supabase Auth handles this via dashboard config, so this may work)
- No invoice/receipt emails (Stripe handles these via Stripe dashboard)
- **No reactivation campaign emails possible** (launch goal blocker)
- No subscription cancellation confirmation
- No failed payment warnings to users

---

#### SEC-08 — Free Unlock Limit Inconsistency
**Severity:** HIGH  
**Location:** `public.unlock_contact()` RPC, `app_settings` table, `packages/hooks/src/useAccess.ts`

**Finding (verified via MCP):**  
Three different values exist for the free unlock limit:
| Location | Value |
|---|---|
| `app_settings.free_unlock_limit` (DB, live) | **1** |
| `unlock_contact` RPC (`v_free_limit CONSTANT int := 3`) | **3** |
| `useAccess` hook (`PLAN_LIMITS.free.unlocks`) | **1** |

The RPC is the actual enforcement mechanism. Free users get **3 unlocks** (per RPC), not 1. The `app_settings` value is not read by the RPC — it's a stale or intentionally different value that may be used elsewhere but is currently a misleading source of truth. The `useAccess` hook showing "1 unlock used of 1" when the user hasn't actually hit their limit will create a confusing, broken UX where users are told they've hit their limit and pay for a subscription when they haven't.

Additionally, `get_unlock_usage` references a `free_unlock_used` column in `profiles` that does not match the actual column name `lifetime_unlocks_used` — this function will silently fail.

**Fix:** Standardise the free unlock limit to one canonical value. Update the RPC or `app_settings`, and sync the client hook.

---

### MEDIUM Severity

---

#### SEC-09 — Admin Contact PATCH Has No Field Allowlist
**Severity:** MEDIUM  
**Location:** `apps/web/src/app/api/admin/contacts/[id]/route.ts`

**Finding (verified via code):**
```typescript
const body = await req.json();
await supabase.from("contacts").update({ ...body }).eq("id", id);
```

An admin can update any column on any contact row including `suppression_status`, `visibility_status`, internal scoring fields, `cron_queued_at`, and any future sensitive column. This is a low-privilege-escalation risk (admin privilege abuse or a compromised admin account) but not externally exploitable.

**Fix:** Define an explicit `ALLOWED_FIELDS` array and filter `body` against it before passing to `.update()`.

---

#### SEC-10 — No Content Security Policy Headers
**Severity:** MEDIUM  
**Location:** `apps/web/src/middleware.ts`

**Finding (verified via code):**  
The middleware sets `X-Frame-Options`, `X-Content-Type-Options`, and `X-Robots-Tag` for `/app/*` routes only. No `Content-Security-Policy` header exists anywhere. No headers at all on `/auth/*`, `/login`, `/signup` routes — the most sensitive pages. In the absence of a CSP, any third-party script injected via a supply-chain attack or DOM-based XSS can exfiltrate session tokens.

**Fix:** Add a CSP header in `next.config.ts` `headers()` or middleware. Minimum: `default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://*.supabase.co https://api.stripe.com`.

---

#### SEC-11 — Public Storage Buckets Have No File Type or Size Limits
**Severity:** MEDIUM  
**Location:** Storage buckets (verified via MCP `storage.buckets`)

**Finding (verified via MCP):**  
Four public buckets (`brand-assets`, `avatars`, `banners`, `profile-media`) have `file_size_limit: null` and `allowed_mime_types: null`. This allows any file type and unlimited file sizes to be uploaded. Without storage RLS policies (could not be verified — `storage.policies` table not accessible via MCP), any authenticated user could potentially upload malicious files or cause storage abuse.

**Fix:** Add `file_size_limit` (e.g., 5MB for avatars) and `allowed_mime_types` (e.g., `['image/jpeg','image/png','image/webp']`) to all public buckets.

---

#### SEC-12 — `createAdminClient()` Exported from Same File as User Client
**Severity:** MEDIUM  
**Location:** `apps/web/src/lib/supabase/server.ts`

**Finding (verified via code):**  
Both `createClient()` (user-scoped, anon key + user session) and `createAdminClient()` (service role) are exported from the same file. A developer importing the wrong function silently elevates privileges, bypassing RLS. This is a developer-error risk, not an external exploit, but service-role client usage is already scattered (3+ routes use it directly via `admin.ts` vs `server.ts`).

**Fix:** Move `createAdminClient` to a separate module (e.g., `supabase/admin-client.ts`) with a comment `// DO NOT import in client components or user-facing API routes`. Consider a lint rule.

---

### LOW Severity

---

#### SEC-13 — No HSTS Header
**Severity:** LOW  
**Location:** `apps/web/src/middleware.ts`  
**Fix:** Add `Strict-Transport-Security: max-age=31536000; includeSubDomains` to middleware response headers.

#### SEC-14 — Terms Acceptance Stored in `sessionStorage`
**Severity:** LOW  
**Location:** Not verified in code — flagged from IMPLEMENTATION_PLAN.md reference  
**Fix:** Store terms acceptance server-side in `profiles.terms_accepted_at`.

#### SEC-15 — Admin Functions Discoverable via DB Introspection
**Severity:** LOW  
**Location:** All SECURITY DEFINER functions in `public` schema  
**Risk:** Any authenticated user can query `information_schema.routines` to enumerate admin function names and signatures, lowering the research cost for targeted attacks.  
**Fix:** Move sensitive admin functions to a non-public schema (e.g., `admin_fns`) or restrict `EXECUTE` privileges.

---

## 4. Subscription Enforcement Audit

### Enforcement Points

| Capability | Enforced Where | Enforced How | DB-Level? | Secure? |
|---|---|---|---|---|
| Free tier search (page 1 only) | `app/page.tsx` server | `offset > 0` returns empty | No | **No** — direct API call bypasses |
| Free unlocks (3 limit) | `unlock_contact` RPC | `lifetime_unlocks_used >= v_free_limit` | Yes | **Yes** — server-side RPC |
| Paid unlock limits | `unlock_contact` RPC | Period count check | Yes | **Yes** — server-side RPC |
| Export (requires subscription) | `log_export` RPC | `monthly_export_limit = 0` → error | Yes | **Yes** — server-side RPC |
| Export rate limit (1/hr) | API route | Upstash Redis | Fail-open | **Conditional** |
| CSV content (unlocked only) | `/api/contacts/export` route | Cross-references `contact_unlocks` | Yes | **Yes** |
| Contact email/phone visibility | Contact detail page (render) | `isUnlocked` conditional | **NO** | **NO — CRITICAL (SEC-01)** |
| Admin panel access | Middleware + layout | `role === 'admin'` | Yes | **Yes** |

### Access Matrix

| User Type | Search | View Name/Role | View Email/Phone | Save to List | Export | Admin |
|---|---|---|---|---|---|---|
| Not logged in | Redirect to /login | No | No | No | No | No |
| Free (0 unlocks) | ✅ Page 1 only (UI) | ✅ | **⚠️ Via API (BUG)** | ✅ | ❌ | ❌ |
| Free (3 unlocks used) | ✅ Page 1 only (UI) | ✅ | **⚠️ Via API (BUG)** | ✅ | ❌ | ❌ |
| Active Pro subscriber | ✅ All pages (UI) | ✅ | ✅ (unlocked only — UI gated) | ✅ | ✅ (75/mo) | ❌ |
| Active Agency subscriber | ✅ All pages (UI) | ✅ | ✅ (unlocked only — UI gated) | ✅ | ✅ (500/mo) | ❌ |
| Past-due subscriber | ✅ All pages (UI, bug?) | ✅ | **⚠️ Via API (BUG)** | ✅ | ❌ | ❌ |
| Cancelled | ✅ Page 1 only (UI) | ✅ | **⚠️ Via API (BUG)** | ✅ | ❌ | ❌ |
| Admin | ✅ All | ✅ | ✅ | ✅ | ✅ | ✅ |

**⚠️ = All authenticated users, regardless of subscription status, can bypass the UI gates by querying PostgREST directly (SEC-01).**

---

## 5. Contact Data Protection Audit

### Premium Field Protection

| Field | DB Column | Anon SELECT Grant | Auth SELECT Grant | RLS Row Filter | App Layer Gate | Protected? |
|---|---|---|---|---|---|---|
| Email | `contacts.email` | **YES** (verified) | **YES** (verified) | Published+active rows | `isUnlocked` render | **NO** |
| Phone | `contacts.phone` | **YES** (verified) | **YES** (verified) | Published+active rows | `isUnlocked` render | **NO** |
| LinkedIn URL | `contacts.linkedin_url` | **YES** (verified) | **YES** (verified) | Published+active rows | `isUnlocked` render | **NO** |
| Instagram URL | `contacts.instagram_url` | **YES** (verified) | **YES** (verified) | Published+active rows | `isUnlocked` render | **NO** |
| X/Twitter URL | `contacts.x_url` | **YES** (verified) | **YES** (verified) | Published+active rows | `isUnlocked` render | **NO** |
| Name, Role, Org | `contacts.name`, etc. | YES | YES | Published+active rows | None (public metadata) | By design |
| `has_email`, `has_phone` | Boolean flag cols | YES | YES | Published+active rows | None (teaser flags) | By design |

### Scraper/Abuse Protection

| Control | Implemented in Code | Deployed to Live DB |
|---|---|---|
| Honeypot contacts (20 traps) | Yes (migration file exists) | **NO** |
| Auto-suspend on honeypot unlock | Yes (migration file exists) | **NO** |
| `contacts_safe` view (no honeypots) | Yes (migration file exists) | **NO** |
| Velocity detection (>200 views/10min) | Yes (migration file exists) | **NO** |
| Sequential browsing detection | Yes (migration file exists) | **NO** |
| Shared-IP multi-account detection | Yes (migration file exists) | **NO** |
| Rate limit on unlock endpoint | Yes (20/min, 200/day — Redis) | Yes (fail-open) |
| Rate limit on export endpoint | Yes (1/hr — Redis) | Yes (fail-open) |
| Export restricted to unlocked contacts | Yes (API route logic) | Yes |
| Honeypot field in export excluded | Code checks `is_honeypot` | **Column does not exist** |

### GDPR / Data Rights

| Control | Status |
|---|---|
| Removal request submission (public) | ✅ Working — `removal_requests` table, any user can INSERT |
| Email suppression list | ✅ Present — 5,733 entries |
| Dedup suppression migration | ✅ Applied |
| Privacy policy page | ❌ Not found |
| Terms of service page | ❌ Not found |
| Cookie consent | Not verified |
| Data deletion / right to erasure (user account) | `/api/account` DELETE route exists — deletes profile + cancels Stripe subscription |

---

## 6. MVP Feature Readiness

| Feature | Exists? | Working? | Secure? | Launch Blocker? | Notes |
|---|---|---|---|---|---|
| User registration / login | ✅ | ✅ | ✅ | No | Supabase Auth, SSR-safe, `getUser()` not `getSession()` |
| Onboarding flow | ✅ | Partial | ✅ | No | Middleware gates on `onboarding_completed`; only 0.2% of 598 users have completed |
| Contact search & browse | ✅ | ✅ | ✅ | No | Safe column projection in search query |
| Contact detail page | ✅ | ✅ | ❌ | **YES** | SELECT * leaks premium fields; UI gate only |
| Contact unlock system | ✅ | ✅ | Partial | **YES** | RPC is sound; DB column grants expose data directly (SEC-01) |
| Free tier (3 unlocks) | ✅ | ✅ | Partial | No | RPC correctly limits; inconsistent with `app_settings.free_unlock_limit = 1` |
| Subscription plans (Pro, Agency) | ✅ | ✅ | ✅ | No | 2 active paid plans with Stripe price IDs |
| Stripe checkout | ✅ | ✅ | ✅ | No | Webhook validates signature, handles all key events |
| Stripe billing portal | ✅ | ✅ | ✅ | No | Customer portal link generation working |
| Failed payment handling | ✅ | Partial | — | No (partial) | Sets `past_due`; no grace-period escalation |
| Save contacts to lists | ✅ | ✅ | ✅ | No | RLS correctly scoped to list owner |
| Export unlocked contacts (CSV) | ✅ | ✅ | ✅ | No | Well-designed — unlocked-only, `log_export` RPC enforces limits |
| Admin dashboard | ✅ | ✅ | ✅ | No | Auth double-checked in layout + middleware |
| Admin user management | ✅ | ✅ | ✅ | No | Suspend, role change, credits with validation |
| Admin audit logs | ✅ | ✅ | ✅ | No | `admin_audit_logs` table, admin-only RLS |
| Admin contact management | ✅ | Partial | Partial | No | PATCH spreads body without field allowlist (SEC-09) |
| Admin email verification (Reoon) | ✅ | ✅ | ✅ | No | Bulk task creation, cron, status tracking |
| Honeypot / scraper detection | ✅ (in code) | ❌ | ❌ | **YES** | Migrations never applied to live DB |
| Analytics / event tracking | ❌ | ❌ | N/A | No | No tracking anywhere (not a hard blocker) |
| Transactional email | ❌ | ❌ | N/A | No (for MVP) | No provider configured |
| Reactivation email campaign | ❌ | ❌ | N/A | **YES** (campaign goal) | No email infrastructure at all |
| Privacy policy page | ❌ | ❌ | N/A | **YES** (legal) | No page found |
| Terms of service page | ❌ | ❌ | N/A | **YES** (legal) | No page found |
| Cookie consent banner | Not verified | Not verified | N/A | **YES** (GDPR) | Not found in codebase |
| Mobile app (React Native) | Stub | ❌ | N/A | No | `apps/mobile/` exists, only `_layout.tsx` and `index.tsx` |

---

## 7. Reactivation Campaign Readiness

| Campaign Requirement | Exists? | Safe to Use? | Notes |
|---|---|---|---|
| Email provider configured | ❌ | N/A | No Resend/SendGrid/SES/Mailgun anywhere |
| User email list (registered users) | ✅ | Partial | 598 profile records with auth email addresses via `supabase.auth.admin.listUsers()` |
| Email suppression / opt-out list | ✅ | ✅ | 5,733 suppressions in `email_suppressions` table |
| Suppression dedup migration | ✅ | ✅ | Applied |
| Unsubscribe handling infrastructure | ❌ | N/A | No unsubscribe endpoint or token generation |
| GDPR double opt-in records | ❌ | N/A | No consent timestamps stored |
| Email template system | ❌ | N/A | No templates found |
| Drip sequence / campaign tooling | ❌ | N/A | No marketing automation |
| CAN-SPAM/GDPR compliance headers | ❌ | N/A | No sending infrastructure to add them to |

**Assessment:** A reactivation campaign requires, at minimum: (1) choosing and integrating an email provider, (2) building an unsubscribe endpoint and storing opt-out records, (3) verifying GDPR consent basis for existing 598 users, (4) creating email templates. This is estimated at 2–3 days of focused engineering work before a single email can be sent safely.

---

## 8. Critical Launch Blockers

| # | Blocker | Severity | Category |
|---|---|---|---|
| B1 | `authenticated` role has unrestricted column-level SELECT on `email`, `phone`, `linkedin_url` — any user can dump all contact data via direct API | CRITICAL | Security |
| B2 | `increment_bonus_credits` RPC callable by any authenticated user with no auth check | CRITICAL | Security |
| B3 | Scraper detection and honeypot systems not deployed to live database | CRITICAL | Security |
| B4 | No privacy policy or terms of service pages (legally required before charging) | HIGH | Legal |
| B5 | Free unlock limit inconsistency (`app_settings = 1`, RPC = 3, hook = 1) causes incorrect UX before paywall | HIGH | Product |
| B6 | `get_unlock_usage` RPC references non-existent `free_unlock_used` column | HIGH | Bug |

**Non-blockers (fix before public marketing):**
- SEC-04: 25+ mutable search_path functions
- SEC-05: Fail-open rate limiter
- SEC-07: No email provider
- SEC-08: No CSP headers

---

## 9. Recommended Fix Plan

### Phase 0 — Pre-launch Blockers (fix before accepting any payment)

**B1 — Fix column-level data exposure:**
1. Revoke SELECT on sensitive columns from `authenticated` and `anon` roles:
   ```sql
   REVOKE SELECT (email, phone, linkedin_url, instagram_url, x_url) 
   ON contacts FROM authenticated, anon;
   ```
2. Update contact detail page API to:
   - Fetch only safe columns via user Supabase client (name, role, org, etc.)
   - Separately fetch gated columns via `createAdminClient()` **only if** `contact_unlocks` record exists for that user+contact pair
3. Verify the page still works for both locked and unlocked states.

**B2 — Fix `increment_bonus_credits`:**
```sql
CREATE OR REPLACE FUNCTION public.increment_bonus_credits(p_user_id uuid, p_amount integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF auth.role() != 'service_role' AND NOT is_admin() THEN
    RAISE EXCEPTION 'Access denied: admin or service_role required';
  END IF;
  UPDATE profiles
  SET bonus_unlock_credits = GREATEST(0, bonus_unlock_credits + p_amount)
  WHERE id = p_user_id;
END;
$$;
```

**B3 — Apply missing migrations:**
Run in Supabase SQL editor or via CLI:
```bash
supabase db push  # or apply migrations manually via MCP
```
Specifically: `20260501_honeypot_contacts.sql` and `20260501_scraper_detection.sql`.

**B4 — Add legal pages:**
Create `/privacy` and `/terms` Next.js pages. These need to exist before charging users in most jurisdictions (UK, EU, US).

**B5/B6 — Fix free unlock limit inconsistency:**
1. Choose the canonical value (recommend: 3 to match RPC)
2. Update `app_settings.free_unlock_limit` to `3`
3. Update `useAccess` hook PLAN_LIMITS to `{ free: { unlocks: 3 } }`
4. Fix `get_unlock_usage` to reference correct column name `lifetime_unlocks_used` not `free_unlock_used`

### Phase 1 — Security Hardening (before public launch / marketing)

1. Fix `search_path` on all 25+ legacy functions (SEC-04)
2. Add CSP headers to `next.config.ts` (SEC-10)
3. Change rate limiter to fail-closed for export endpoint (SEC-05)
4. Add field allowlist to admin contact PATCH (SEC-09)
5. Add `file_size_limit` and `allowed_mime_types` to public storage buckets (SEC-11)
6. Add HSTS header (SEC-13)
7. Define `payment_failed` grace period logic (SEC-06)

### Phase 2 — Reactivation Campaign Readiness

1. Integrate email provider (recommend Resend — Next.js native, simple API)
2. Build `POST /api/unsubscribe?token=xxx` endpoint with HMAC-signed tokens
3. Store `email_opted_in_at` timestamp in profiles
4. Verify legal basis for contacting existing 598 users
5. Create welcome, subscription confirmation, and reactivation email templates

---

## 10. Fastest Safe Launch Path

If the goal is to accept the first paying customer as fast as possible while not being criminally liable or commercially exploitable:

**Day 1 (morning):**
- Revoke column-level SELECT grants on email/phone/social (1 SQL migration, 15 min)
- Fix `increment_bonus_credits` auth check (1 SQL migration, 10 min)
- Apply honeypot + scraper detection migrations (run 2 existing migration files, 20 min)
- Test: verify contact page still shows unlocked fields for a test user

**Day 1 (afternoon):**
- Fix free unlock limit inconsistency (update `app_settings`, update hook constant)
- Fix `get_unlock_usage` column reference
- Create minimal `/privacy` and `/terms` pages (even single-page placeholder with business details)
- Test: full signup → free unlock → paywall → subscribe → unlock flow

**Day 2:**
- Deploy to production
- Verify Stripe webhook is receiving events on live mode
- Manual smoke test: free user cannot retrieve email via DevTools / direct API
- Confirm admin panel functional

**Launch: Day 2 end of day**

---

## 11. Testing Checklist

### Authentication
- [ ] Unauthenticated user visiting `/app/` redirects to `/login`
- [ ] Unauthenticated user visiting `/admin/` redirects to `/login`
- [ ] Non-admin user visiting `/admin/` redirects to `/app/`
- [ ] Suspended user visiting `/app/` redirects to `/suspended`
- [ ] User without completed onboarding redirects to `/onboarding`

### Free Tier Enforcement (post-fix)
- [ ] Free user can search page 1 only
- [ ] Free user attempting page 2 gets empty results server-side
- [ ] Free user can unlock up to 3 contacts (matches RPC limit)
- [ ] Free user cannot unlock 4th contact (RPC returns `upgrade_required`)
- [ ] **Free user calling `GET /rest/v1/contacts?select=email,phone` directly returns no `email`/`phone` data** (post-fix verification)
- [ ] **`rpc/increment_bonus_credits` called by non-admin authenticated user returns error** (post-fix verification)

### Subscription Flow
- [ ] Stripe checkout creates subscription and sets `status = 'active'`
- [ ] Active subscriber can unlock up to plan limit per period
- [ ] Active subscriber cannot unlock beyond plan limit (no bonus credits)
- [ ] Active Agency subscriber can unlock unlimited contacts
- [ ] Stripe portal loads correctly for existing subscriber
- [ ] Subscription cancellation sets `status = 'canceled'` in DB

### Contact Data Gating
- [ ] Unlocked contact page shows email, phone, social links
- [ ] Non-unlocked contact page shows lock/upgrade UI only
- [ ] Export CSV contains only unlocked contacts for that user
- [ ] Export blocked for free users (`log_export` returns `upgrade_required`)
- [ ] Export limit enforced (cannot export > plan monthly limit)
- [ ] `is_honeypot` contacts not included in export (post-migration)

### Scraper Detection (post-migration)
- [ ] Unlocking a honeypot contact auto-suspends the user
- [ ] Contact views are recorded in `contact_views` table
- [ ] User with >200 views in 10 min gets suspended by cron

### Admin
- [ ] Admin can view all contacts, users, logs
- [ ] Admin can suspend/unsuspend user
- [ ] Admin can add bonus credits (via admin panel only)
- [ ] Non-admin cannot access `/admin/*` routes
- [ ] Admin audit log records actions

---

## 12. Final Verdict

### **Grade: C+ — Not safe to accept live payments yet**

The application has strong bones: the Supabase Auth integration is done correctly, the unlock and export RPC logic is well-designed with proper ACID guarantees and race condition protection, the Stripe webhook handling is sound, and the admin tooling is comprehensive.

However, the contact detail business model — selling access to email and phone numbers — is **entirely unprotected at the database layer**. The core commercial proposition can be extracted for free by anyone who registers an account and calls the PostgREST API directly. Launching with this vulnerability while charging £39–£149/month is a significant risk: any technically-aware user could extract all 12,292 contact records and either resell the data or publicly embarrass the business.

The secondary unmitigated risk — a publicly-callable RPC that grants arbitrary bonus credits — could be trivially exploited to unlock any contact for free even after the column grants are revoked.

Both of these issues are **1–2 hour fixes** once identified. The system is otherwise production-ready.

**Upgrade path to Grade B (safe to launch):** Complete all Phase 0 items listed in §9. Estimated time: 1–2 days.  
**Upgrade path to Grade A (confident launch):** Complete Phase 0 + Phase 1. Estimated time: 3–5 days.

| Area | Score | Notes |
|---|---|---|
| Auth architecture | A | SSR-safe, uses `getUser()`, proper middleware |
| Database RLS | B+ | All tables have RLS; column-level grants unprotected |
| Subscription enforcement (RPC) | A- | `unlock_contact` and `log_export` are well-designed |
| Subscription enforcement (app layer) | C | UI-only gates bypassable via direct API |
| Payment handling | B | Stripe solid; no grace period for failed payments |
| Admin security | B | Functional; PATCH allowlist missing |
| Scraper protection | F | Written but not deployed |
| Email / comms | F | No infrastructure |
| Legal compliance | F | No privacy policy, no terms |
| **Overall** | **C+** | **Fix SEC-01 and SEC-02 before accepting payments** |
