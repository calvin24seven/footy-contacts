# Football Contacts — Implementation Plan

> Last analysed: April 2026  
> Status: Pre-revenue · 598 active users · 0 paying subscribers  
> Objective: First £ in → repeatable growth loop → two-sided platform

---

## 1. Current State Analysis

### Database (live counts as of analysis)

| Table | Rows | Notes |
|---|---|---|
| contacts | 27,578 | Core asset |
| contacts_legacy | 54,250 | Old import data, not surfaced |
| profiles | 598 | 145 accounts with no profile record |
| subscriptions | 0 | **No paying customers** |
| contact_unlocks | 1 | 1 unlock ever, 1 free user |
| opportunities | 0 | Table and schema exist, nothing posted |
| saved_searches | 0 | Table exists, no alerts wired |
| organisations | 0 | Table exists, not populated |
| contact_role_history | 0 | Table exists, unused |
| exports | 0 | No exports ever |
| email_suppressions | 5,733 | Healthy suppression list |
| email_verification_tasks | 10 (all completed) | Manual batch only |
| csv_imports | 8 | Data import pipeline works |
| waitlist | 3 | Negligible |

### Contact Data Quality

| Metric | Count | % |
|---|---|---|
| Total contacts | 27,578 | — |
| Has LinkedIn | 27,578 | 100% |
| Has phone | 23,191 | 84% |
| Has email | 12,242 | 44% |
| Verified email | 6,883 | 25% |
| Catch-all email | 2,651 | 10% |
| Unverified email | 15,336 | 56% |
| Unknown email | 2,708 | 10% |
| **Has category** | **0** | **0% — critical gap** |
| **Has role_category** | **0** | **0% — critical gap** |
| Countries represented | 114 | Global |

### User Funnel (broken)

| Stage | Count | Conversion |
|---|---|---|
| Registered users | 743 | — |
| Has profile record | 598 | 80% |
| Completed onboarding (`user_type` set) | 1 | **0.2%** |
| Used free unlock | 1 | **0.2%** |
| Active subscription | 0 | 0% |


### Signup Trend (monthly)

```
Mar 25:  17
Apr 25:  40
May 25:  49
Jun 25:  41
Jul 25:  60
Aug 25:  43
Sep 25:  33
Oct 25:  42
Nov 25:  35
Dec 25:  38
Jan 26:  49
Feb 26:  56
Mar 26:  43
Apr 26:  51  ← in progress
```

Growth is organic and consistent (~40–60/month). The funnel top is working. 

### Cron Jobs

- `check-credit-resets` — runs hourly: calls `process_due_credit_resets()`
- `process-credit-resets-daily` — runs at midnight: same function

No email alert jobs. No search alert jobs. No verification ingest job.

### App Settings

| Key | Value |
|---|---|
| free_unlock_limit | 1 |
| min_onboarding_step | 4 |
| search_page_size_free | 25 |
| search_page_size_paid | 50 |
| maintenance_mode | false |
| contact_db_version | v2 |

### Plans (current)

| Plan | Monthly | Annual | Unlocks | Exports |
|---|---|---|---|---|
| Free | £0 | — | 1 (lifetime) | 0 |
| Starter | £29 | £290 | 50/mo | 25/mo |
| Pro | £79 | £790 | 250/mo | 150/mo |
| Agency | £149 | £1,490 | 750/mo | 500/mo |

---

## 2. Critical Gaps (Priority Ranked)

### P0 — Blocking First Revenue

2. **Category/role_category columns are 0% populated** — Filters like "Scout", "Agent", "Club Official" show 0 results, making the product feel empty to new users.
3. **No post-login nudge** — Users land on the search page with no guidance, no value demonstration, no prompt to upgrade.

### P1 — Converting Trial Users to Paid

4. **No unlock wall UX** — When free unlock is used, there is no clear "you've used your free unlock, upgrade to get 50/month" message with a direct CTA.
5. **No saved search alerts** — The table exists (`saved_searches`) with the right schema (`id, user_id, name, query, filters`) but nothing persists or emails alerts. Power-user retention feature.
6. **Pricing too complex** — 3 paid tiers (£29/£79/£149) creates paradox of choice. Simplify to 2 tiers for first paying customers.

### P2 — Growing ARPU and Network

7. **No CRM notes on contacts** — Agents and scouts need to track conversations. Without notes, this is a directory, not a tool. Zero `contact_notes` table exists.
9. **Opportunities empty** — The table, schema, and listing UI all exist. No content. This is the network effect flywheel — needs seeding and a posting UI for non-admin users.
10. **Player profiles not surfaceable** — `profiles` has `position`, `current_club`, `highlight_video_url`, `football_level`, `open_to_opportunities` — all the player profile fields. No search or listing UI for players.

### P3 — Platform & Moat

11. **No referral programme** — With 40–60 signups/month organically, a referral loop could double this.
12. **No email verification automation** — 10 manual tasks exist, all completed. No ingest hook when new contacts are added. 56% of contacts have unverified emails — a key trust differentiator.
13. **No bulk select/export on search** — Power users (agencies) need to export lists of contacts. Export table exists but 0 rows.
14. **No team seats / org accounts** — Agency plan is solo. Real agencies have 3–10 users.

---

## 3. Feature List (Prioritised)

### Sprint 1 (Week 1–2): Fix Activation Funnel

- [ ] **Enforce onboarding completion** — Gate app access behind onboarding. Check profile table for 'onboarding_complete' + onboarding_complete_time columns (create it) and redirect to `/onboarding` if false. The `min_onboarding_step = 4` setting should be honoured.
- [ ] **Populate category / role_category** — Write a rule-based SQL script mapping role keywords to categories (Agent, Scout, Club Official, Media, Player, Coach, Medical, Performance). Run as a one-off migration, then add a trigger for new inserts in admin area
- [ ] **Free unlock wall** — After the 1 free unlock is used, intercept the next unlock attempt with a modal: "You've used your free unlock. Upgrade to unlock 50 contacts/month." Direct CTA to `/app/billing`.
- [ ] **Post-login welcome banner** — Show a dismissable banner on first login (stored in `localStorage`): "You have 1 free contact unlock. Use it to see email, phone, and LinkedIn for any contact."
- [ ] **Bulk export** — Paid users can export search results to CSV. `exports` table already exists. Route: `POST /api/exports`. Enforce monthly limit from plan. Frontend: "Export results" button in search meta bar (paid only).
- [ ] **Referral programme** — Unique referral link per user. `referral_code` column on `profiles`. Referrer gets 15 bonus unlocks on first paying conversion. Track via `referral_conversions` table. Show "Refer a friend" in profile/settings.
- [ ] **Simplify pricing** — Collapse to 2 tiers: PlanPriceWhat you getLogicFree£03 unlocks lifetime, browse allGenerous enough to feel the productPro£39/mo or £390/yr150 unlocks, 75 exports, saved searchesSingle paid tier — simplicity convertsAgency£149/mo or £1,490/yrUnlimited unlocks, 500 exports, 3 seats, Anchors value, attracts serious buyers Update `plans` table and Stripe products. Keep annual discount (2 months free). Remove Starter tier or keep as legacy.
- [ ] **Upgrade prompt on search limit** — Free users see 25 results. Add a "Showing 25 of 12,400 results — Upgrade to see all" banner at the bottom of results with upgrade CTA.

- [ ] **Unlock usage widget** — On the search page right rail (desktop) or top of page (mobile), show "X / 50 unlocks used this month" with a progress bar. If >80% used, show amber warning. If 100%, show upgrade CTA.




### Sprint 3 (Month 2): Power User Features
- [ ] **Team seats** — Agency plan: up to 3 user seats. `team_members` table: `id, owner_user_id, member_user_id, invited_email, status, created_at`. Invite via email. Members share the pool of unlocks. Frontend: manage team in `/app/settings`.


- [ ] **Saved search alerts** — Save a search from the filter bar. Store in `saved_searches` (table already exists). Add a cron job (daily/weekly) to re-run the query and email the user if new contacts appeared since last alert. Frontend: "Save this search" button in `SearchFilters`, alert frequency selector (daily/weekly).
- [ ] **CRM notes on contacts** — New `contact_notes` table: `id, user_id, contact_id, body, created_at, updated_at`. Route: `POST /api/contacts/[id]/notes`, `GET` same. Frontend: notes tab in `ContactPreview` / contact detail page. RLS: user can only read/write own notes.
- [ ] **Unlock top-up packs** — Stripe one-time payment (Checkout, not subscription). Products: 25 unlocks £15, 100 unlocks £45, 250 unlocks £90. On payment, insert into `subscription_usage_periods` (or new `unlock_top_ups` table). Show "Buy more unlocks" CTA in `UnlocksWidget` when depleted.
- [ ] **Seed opportunities** — Admin can post opportunities via `/admin/opportunities`. Populate with 10–20 real football job listings (trial days, academy openings, coaching vacancies). Drives return visits and player profile signups. clear label - footy contacts team on player facing opportuntiies page

### Sprint 4 (Month 2–3): Opportunities as Network Effect

- [ ] **Opportunity posting for paid users** — Paid plan users can post an opportunity (jobs, trials, events). Route: `POST /api/opportunities`. Frontend: "Post an Opportunity" button on `/app/opportunities` for paid users. Rate limit: 1 free post/month on Pro, 5 on Agency.
- [ ] **Opportunity application flow** — `opportunity_responses` table already has the right schema. Build the application form: name, age, position, location, current_club, level, message, highlight_video_url. On submit, `POST /api/opportunities/[id]/apply`. Email the poster on new application.
- [ ] **Player profile listing** — New page `/app/players`. Queries `profiles` where `open_to_opportunities = true`. Filterable by position, age group, level, country. Gated: paid plans only (or free with 3 previews). This is the second side of the two-sided platform.
- [ ] **Player profile public page** — `/p/[username]` — public-facing profile with position, level, club, highlight video embed. Shareable link. Players set `open_to_opportunities = true` during onboarding.

### Sprint 5 (Month 3): Monetisation Polish

- [ ] **Team seats** — Agency plan: up to 3 user seats. `team_members` table: `id, owner_user_id, member_user_id, invited_email, status, created_at`. Invite via email. Members share the pool of unlocks. Frontend: manage team in `/app/settings`.

---

## 4. Month-by-Month Roadmap

### Month 1: Activation → First Paying Customer

**Goal**: Get 1–3 paying subscribers. Fix the funnel so signups actually experience the product.

| Week | Work |
|---|---|
| 1 | Enforce onboarding gate · Populate category/role_category (SQL script) · Free unlock wall modal |
| 2 | Post-login welcome banner · Upgrade prompt on search limit · Unlock usage widget |
| 3 | Simplify pricing to 2 tiers (Pro + Agency) · Update Stripe products · Email 742 cold users |
| 4 | Manual outreach to top 20 engaged users (signed up, came back ≥2 times) · Fix any conversion blockers from user feedback |

**Success Metrics**:
- Onboarding completion rate: >50% (from 0.2%)
- Free unlock usage rate: >20% (from 0.2%)
- Paid conversion: ≥1 subscriber
- MRR: £49+

---

### Month 2: Retention → Product-Market Fit Signal

**Goal**: Keep early subscribers. Add features that make the product sticky.

| Week | Work |
|---|---|
| 5 | Saved search alerts (backend cron + email) · Save search UI |
| 6 | CRM notes on contacts (DB + API + frontend) |
| 7 | Unlock top-up packs (Stripe one-time) · Seed 20 real opportunities |
| 8 | Recently viewed contacts (table exists, just build UI in sidebar) · Opportunity application form |

**Success Metrics**:
- Saved searches created: ≥10
- Notes created: ≥20
- Top-up purchases: ≥1
- Churn rate: <20%
- MRR: £200+

---

### Month 3: Network Effect → Two-Sided Platform

**Goal**: Make Footy Contacts the place football opportunities are posted and players are found.

| Week | Work |
|---|---|
| 9 | Opportunity posting for paid users · Email verification automation (ingest hook) |
| 10 | Player profile listing page (`/app/players`) · Player profile public page (`/p/[username]`) |
| 11 | Bulk export for paid users · Referral programme |
| 12 | Team seats (Agency plan) · Pricing restructure if market signals warrant it |

**Success Metrics**:
- Opportunities posted by users: ≥5
- Player profiles visible: ≥20 (opt-in from existing users)
- Applications submitted: ≥10
- Referral signups: ≥5
- MRR: £500+

---

### Months 4–6: Scale

- **API tier** (£500/mo) — Bulk access for data vendors, football analytics companies. Serve contacts via authenticated REST API with rate limiting.
- **Academy/institution accounts** — Custom pricing for football academies who want to verify player eligibility, track contacts, post multiple opportunities.
- **Data enrichment pipeline** — Automated LinkedIn scraping / email verification for new imports. Target: 75% of contacts with verified email.
- **Mobile app** — `apps/mobile` (Expo) already exists. Build native unlock + opportunities browsing.

---

## 5. Technical Implementation Notes

### 5.1 Onboarding Gate

**File**: `apps/web/src/app/app/layout.tsx`

```typescript
// In AppLayout, after fetching profile:
if (!profile?.user_type && pathname !== '/onboarding') {
  redirect('/onboarding')
}
```

The `onboarding` page already collects `user_type`, `primary_goals`, `football_level`, `position`, `current_club`, `highlight_video_url`. The final step should `UPDATE profiles SET user_type = ..., onboarding_completed = true`.

The `onboarding_completed` boolean column exists on `profiles` but is not checked anywhere in the app layout.

---

### 5.2 Category Population Script

**Migration**: `supabase/migrations/YYYYMMDD_populate_categories.sql`

Strategy: keyword-match on `role` column using `ILIKE` patterns.

```sql
UPDATE contacts SET category = 'Agent / Manager'
WHERE role ILIKE ANY(ARRAY['%agent%', '%manager%', '%representative%', '%intermediary%']);

UPDATE contacts SET category = 'Scout'
WHERE role ILIKE ANY(ARRAY['%scout%', '%scouting%', '%talent id%']);

UPDATE contacts SET category = 'Club Official'
WHERE role ILIKE ANY(ARRAY['%director%', '%chairman%', '%president%', '%ceo%', '%chief%', '%owner%', '%executive%']);

UPDATE contacts SET category = 'Coach'
WHERE role ILIKE ANY(ARRAY['%coach%', '%manager%', '%head of%', '%first team%']);

UPDATE contacts SET category = 'Medical'
WHERE role ILIKE ANY(ARRAY['%physio%', '%doctor%', '%medical%', '%sport science%']);

UPDATE contacts SET category = 'Media'
WHERE role ILIKE ANY(ARRAY['%journalist%', '%reporter%', '%editor%', '%presenter%', '%commentator%', '%media%']);

UPDATE contacts SET category = 'Performance'
WHERE role ILIKE ANY(ARRAY['%fitness%', '%strength%', '%conditioning%', '%performance%', '%analyst%']);
```

Order matters (most specific first). Unmatched contacts remain null (filterable as "Other").

Also add a Postgres trigger on `contacts` `INSERT`/`UPDATE` to auto-apply rules for new data.

---

### 5.3 Free Unlock Wall

**Files**: `apps/web/src/app/api/contacts/[id]/unlock/route.ts` (or the `unlock_contact` RPC call site)

The `unlock_contact` RPC already returns error codes when limits are exceeded. The frontend needs to handle the error case and show a modal/drawer instead of a toast.

Add a new client component `UnlockWallModal.tsx`:

```
- Triggered when unlock fails with "limit_exceeded" error
- Shows: "You've used your free unlock"
- Upgrade button → /app/billing
- "See all plans" link
```

Wire into `ContactCTA` (in `ContactRow.tsx`) — it currently calls the unlock RPC. Add error state handling.

---

### 5.4 Saved Search Alerts

**DB**: `saved_searches` table already has `id, user_id, name, query, filters, created_at, updated_at`.

Add columns:
```sql
ALTER TABLE saved_searches ADD COLUMN alert_frequency TEXT DEFAULT 'none'; -- 'none' | 'daily' | 'weekly'
ALTER TABLE saved_searches ADD COLUMN last_alerted_at TIMESTAMPTZ;
ALTER TABLE saved_searches ADD COLUMN last_result_count INT DEFAULT 0;
```

**Cron job**: New `pg_cron` job at `0 9 * * *` (9am daily):
```sql
SELECT process_saved_search_alerts();
```

The `process_saved_search_alerts()` function:
1. Fetches all saved searches with `alert_frequency != 'none'` and due for alert
2. Re-runs each search query
3. Compares result count to `last_result_count`
4. If count increased, calls `http_post` to a Supabase Edge Function `send-search-alert`
5. Updates `last_alerted_at` and `last_result_count`

**Frontend** (`SearchFilters.tsx`): Add "Save this search" button. Opens a small modal to name the search and set alert frequency. `POST /api/saved-searches`.

---

### 5.5 CRM Notes

**New migration**:
```sql
CREATE TABLE contact_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE contact_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own notes" ON contact_notes
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX ON contact_notes(user_id, contact_id);
```

**API**: `apps/web/src/app/api/contacts/[id]/notes/route.ts`
- `GET` — fetch notes for contact (own user)
- `POST` — create note

**Frontend**: Add a "Notes" tab to `ContactPreview.tsx` and the full contact detail page. `textarea` + submit button. Notes listed below sorted by `created_at DESC`. Edit/delete in place.

---

### 5.6 Unlock Top-Up Packs

**Stripe**: Create 3 one-time products in Stripe dashboard:
- `topup_25` — £15 — 25 unlocks
- `topup_100` — £45 — 100 unlocks
- `topup_250` — £90 — 250 unlocks

**API**: `apps/web/src/app/api/billing/topup/route.ts`
- Creates a Stripe Checkout session in `payment` mode (not subscription)
- `success_url` and `cancel_url` back to `/app/billing`
- `metadata: { user_id, unlock_count }`

**Webhook** (`apps/web/src/app/api/stripe/webhook/route.ts`): Handle `checkout.session.completed` for top-up sessions:
- Read `unlock_count` from metadata
- Insert top-up record and add to current `subscription_usage_periods` available balance

**Frontend**: `UnlocksWidget.tsx` — add "Buy more" CTA below the progress bar. Billing page: add "Top-up packs" section.

---

### 5.7 Opportunities Posting (Non-Admin)

**RLS change**:
```sql
CREATE POLICY "Paid users can insert opportunities"
ON opportunities FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM subscriptions s
    WHERE s.user_id = auth.uid() AND s.status = 'active'
  )
);
```

**Frontend**: 
- `/app/opportunities/new` page — form matching all `opportunities` columns
- "Post an opportunity" button on `/app/opportunities` (shown to paid users only)
- Admin (`/admin/opportunities`) already has the posting UI via `OpportunityForm.tsx`

---

### 5.8 Player Profile Listing

**Query**: `SELECT id, full_name, username, position, football_level, current_club, country, highlight_video_url FROM profiles WHERE open_to_opportunities = true`

**Page**: `/app/players` — grid of player cards. Each card shows: name, position, level, club, country. Click → `/p/[username]`.

**Gating**: Free users see 5 players. Paid users see all. Add upgrade CTA at the bottom of the free preview.

**Public profile** (`/p/[username]`): No auth required. Shows player details. "Contact" button → requires login + unlock (or links to opportunity application).

---

### 5.9 Email Verification Automation

**Current state**: `email_verification_tasks` has 10 rows, all `completed`. Tasks are created manually by admin. There is no trigger on new contact inserts.

**Target state**: 
1. Postgres trigger on `contacts INSERT` — if `email IS NOT NULL AND verified_status = 'unverified'`, auto-create an `email_verification_task`.
2. Supabase Edge Function `process-verification-tasks` — polls verifier API (e.g. Reoon, ZeroBounce) in batches of 100. Run via new cron job: `0 3 * * *`.
3. On verification result, `UPDATE contacts SET verified_status = 'verified' | 'catch_all' | 'invalid'`.

---

### 5.10 Referral Programme

**DB**:
```sql
ALTER TABLE profiles ADD COLUMN referral_code TEXT UNIQUE DEFAULT SUBSTRING(gen_random_uuid()::text, 1, 8);
ALTER TABLE profiles ADD COLUMN referred_by UUID REFERENCES profiles(id);

CREATE TABLE referral_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES profiles(id),
  referred_id UUID REFERENCES profiles(id),
  converted_at TIMESTAMPTZ, -- set when referred user first pays
  reward_unlocks INT DEFAULT 5,
  rewarded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Signup flow**: Accept `?ref=CODE` on `/signup`. Store in cookie. On profile creation, set `referred_by`.

**Conversion hook**: In Stripe webhook `customer.subscription.created` handler, check `referred_by` on new subscriber → create `referral_rewards` record → add bonus unlocks.

**Frontend**: `/app/settings` — "Refer a friend" section. Shows unique link. "You get 5 bonus unlocks for every friend who subscribes."

---

## 6. Backend Health Notes

### RLS Coverage
All 26 public tables have RLS enabled. ✓

### Missing Indexes (to add with category migration)
```sql
CREATE INDEX ON contacts(category) WHERE category IS NOT NULL;
CREATE INDEX ON contacts(role_category) WHERE role_category IS NOT NULL;
```
These are already indexed for `NULL` cases via the existing migration. The category population script should be run after confirming the index is in place.

### Cron Jobs to Add
| Job | Schedule | Function |
|---|---|---|
| process-saved-search-alerts | `0 9 * * *` | `process_saved_search_alerts()` |
| process-verification-tasks | `0 3 * * *` | Call Edge Function |
| weekly-digest-email | `0 8 * * 1` | `send_weekly_digest()` |

---

## 7. Success Metrics (KPIs to Track)

### Activation
- Onboarding completion rate (target: >50%)
- Free unlock used within 24h of signup (target: >30%)
- Return visit rate D7 (target: >25%)

### Conversion
- Free → Paid conversion rate (target: 3–5%)
- MRR (target Month 1: £150, Month 3: £1,000, Month 6: £5,000)
- Average revenue per user (target: £60/mo)

### Engagement
- Unlocks per active user per month (target: >10)
- Saved searches per user (target: >1)
- Notes created per active user (target: >5)
- Return visits per week (target: >2)

### Data Quality
- % contacts with category populated (target: >80% after script)
- % contacts with verified email (target: >40% after automation)

### Network
- Opportunities posted (target Month 3: >20)
- Player profiles live (target Month 3: >50)
- Applications submitted (target Month 3: >20)

---

## 8. Quick Wins (Do These Today)

1. **Run category population SQL** — Zero effort, immediate impact on filters UX (currently all category filters return 0 results).
2. **Fix onboarding gate** — 4-line change in `app/layout.tsx`. Stops the activation funnel bleed immediately.
3. **Email the 742 users** — Manual Supabase export + Resend. Template: "You signed up but never unlocked a contact. Here's what you get when you do." Include a real example. Free to send. Could convert 1–3 users immediately.
4. **Post 5 real opportunities manually via admin** — Table and listing UI exist. Gives new users something to discover on their second visit.
5. **Add "Upgrade to see all results" banner** — Free users hit 25 results. Show a conversion nudge. 2-hour frontend change.

---

## 9. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Category script misclassifies contacts | Medium | Medium | Manual audit of 100 sample rows before running; add `category_confidence` float column |
| Onboarding gate breaks existing sessions | Low | High | Test with staging env; add `?skip_onboarding=1` admin bypass |
| Stripe top-up webhook missed → no credits | Low | High | Idempotency key on webhook; retry queue; admin top-up override |
| Email alerts trigger spam complaints | Medium | Medium | Double opt-in for alerts; unsubscribe link in every email |
| Player profiles create GDPR exposure | Low | High | Players explicitly opt-in; clear privacy policy; GDPR deletion route |
| Opportunities used for spam/fake listings | Medium | Medium | Paid users only; admin review queue for first 30 days |

---

*End of implementation plan. This document should be reviewed and reprioritised fortnightly as new subscriber data comes in.*
