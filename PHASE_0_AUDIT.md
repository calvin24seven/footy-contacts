# Footy Contacts — Phase 0 Audit

> Conducted: May 2026  
> Scope: Full-stack audit of the web app (`apps/web`) and marketing site (`apps/marketing`) across UX, brand, design system, auth flows, onboarding, dashboard, search, unlock, security, and frontend architecture.

---

## Table of Contents

1. [Project Structure Overview](#1-project-structure-overview)
2. [Design System & Brand Tokens](#2-design-system--brand-tokens)
3. [Public Marketing Website](#3-public-marketing-website)
4. [Sign Up Page](#4-sign-up-page)
5. [Sign                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  In Page](#5-sign-in-page)
6. [Password Reset & Auth Flows](#6-password-reset--auth-flows)
7. [Email Verification Flow](#7-email-verification-flow)
8. [Onboarding Flow](#8-onboarding-flow)
9. [Logged-In Home / Dashboard](#9-logged-in-home--dashboard)
10. [Logged-In Navigation](#10-logged-in-navigation)
11. [Search Experience](#11-search-experience)
12. [Contact Detail & Unlock Flow](#12-contact-detail--unlock-flow)
13. [Opportunities & Trials](#13-opportunities--trials)
14. [Billing & Upgrade](#14-billing--upgrade)
15. [Component Architecture](#15-component-architecture)
16. [Security Assessment](#16-security-assessment)
17. [Analytics & Activation Tracking](#17-analytics--activation-tracking)
18. [SEO & Performance](#18-seo--performance)
19. [Summary: Critical Issues by Priority](#19-summary-critical-issues-by-priority)

---

## 1. Project Structure Overview

### Monorepo layout

```
footy-contacts/
├── apps/
│   ├── marketing/          # footycontacts.com — public marketing site (Next.js 15)
│   └── web/                # app.footycontacts.com — main SaaS app (Next.js 15)
├── packages/
│   ├── hooks/              # useAccess, useProfile, useSubscription
│   ├── supabase/           # shared Supabase client + types
│   └── types/              # shared TypeScript types
└── supabase/
    └── migrations/         # 15+ SQL migration files
```

### Web app route tree

```
apps/web/src/app/
├── page.tsx                  # Standalone landing page (footycontacts.com redirect goes here)
├── layout.tsx                # Root layout: Inter font, QueryClient, CookieConsent
├── globals.css               # Brand tokens + shared utility classes
├── providers.tsx             # React Query provider
│
├── login/page.tsx            # Sign in
├── signup/page.tsx           # Sign up (email + Google OAuth present)
├── forgot-password/page.tsx  # Password reset request
├── onboarding/page.tsx       # 4-step onboarding (massive single file)
│
├── auth/
│   ├── callback/route.ts     # PKCE exchange + recovery OTP handler
│   └── update-password/      # (exists but not audited in detail)
│
├── app/
│   ├── layout.tsx            # Auth gate, TopNav, BottomNav, UnlocksProvider
│   ├── page.tsx              # Dashboard = Search (contacts list)
│   ├── TopNav.tsx
│   ├── BottomNav.tsx
│   ├── SearchBar.tsx
│   ├── SearchFilters.tsx
│   ├── ContactsList.tsx
│   ├── ContactRow.tsx
│   ├── ContactPreview.tsx
│   ├── UnlocksWidget.tsx
│   ├── UnlocksProvider.tsx
│   ├── UnlockWallModal.tsx
│   ├── UpgradeModal.tsx
│   ├── WelcomeBanner.tsx
│   ├── contacts/[id]/
│   │   ├── page.tsx          # Contact detail page
│   │   └── UnlockButton.tsx
│   ├── opportunities/page.tsx
│   ├── lists/                # Saved lists
│   ├── exports/              # Export history
│   ├── billing/              # Plans + subscription management
│   ├── profile/              # User profile form
│   └── settings/             # Account security
│
├── api/
│   ├── contacts/[id]/unlock/route.ts   # POST unlock
│   ├── contacts/export/route.ts        # POST CSV export
│   ├── account/unlocks/route.ts        # GET unlock usage
│   ├── billing/checkout/               # Stripe checkout
│   ├── billing/portal/                 # Stripe portal
│   ├── email/                          # Email queue
│   ├── cron/                           # Cron jobs
│   └── webhooks/                       # Stripe webhooks
│
├── admin/                    # Admin dashboard (role-gated)
├── upgrade/page.tsx          # Reactivation campaign redirect (COMEBACK50)
├── suspended/                # Suspended user holding page
├── unsubscribed/             # Email unsubscribe
└── middleware.ts             # Session refresh, auth, role, onboarding gates
```

### Key observations

- The web app and marketing site are **two separate Next.js apps** on different domains. This creates two divergent design systems and duplicated global CSS.
- The web app has its own landing page at `/` which largely duplicates the marketing site's homepage.
- All shared packages (`@footy/hooks`, `@footy/supabase`, `@footy/types`) are available but **appear to be lightly used** inside the web app — most components import directly from `@/lib/supabase/client` rather than the shared package.

---

## 2. Design System & Brand Tokens

### Current token definitions

**`apps/web/src/app/globals.css`**
```css
@theme {
  --color-gold:        #F9D783;
  --color-gold-dark:   #E8C355;
  --color-navy:        #222C41;
  --color-navy-light:  #2E3A52;
  --color-navy-dark:   #161E2E;
  --color-surface:     var(--color-navy-light);
  --color-page:        var(--color-navy-dark);
  --color-border:      color-mix(in srgb, var(--color-navy-light) 100%, transparent);
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
}
```

**`apps/marketing/src/app/globals.css`**  
Identical colour values but **no semantic aliases** (no `surface`, `page`, `border`).

### Shared utility classes (web app only)

```css
.input-base   — consistent input styling
.btn-primary  — gold button
.btn-secondary — navy-light ghost button
.card         — navy-light rounded-xl
```

### Issues found

| # | Issue | Severity |
|---|-------|----------|
| D1 | No typography scale defined. Heading sizes, body sizes, and weight rules are arbitrary per-component. | High |
| D2 | No spacing scale. Components use ad-hoc Tailwind values (`p-6`, `p-4`, `px-5 py-4`, `px-6 py-5`). | Medium |
| D3 | No border-radius scale. Values include `rounded-lg`, `rounded-xl`, `rounded-2xl`, `rounded-full` mixed without pattern. | Medium |
| D4 | No shadow / glow tokens. No gold glow, card drop shadow, or inner glow effects. All cards look flat. | High |
| D5 | No gradient tokens. No hero gradient, background texture, or gold gradient strip. | High |
| D6 | Shared utilities defined in `globals.css` are **web app only**. Marketing site does not share these. | Medium |
| D7 | Marketing site hardcodes hex values inline (`bg-[#2E3A52]`, `text-[#F9D783]`) rather than using Tailwind tokens. | Medium |
| D8 | No formal brand system file. No `tokens.ts`, no `brand.ts`, no central source of truth for brand decisions. | High |
| D9 | Onboarding uses a hardcoded background colour `bg-[#080c17]` and card colour `bg-[#111827]` — neither matches the brand palette. These are one-off values with no documented intent. | Medium |
| D10 | Contact preview panel uses `bg-[#0d1a2e]` — another unlisted colour outside the brand palette. | Low |
| D11 | `btn-primary` and `btn-secondary` utility classes exist but are **not used consistently**. Most components inline-repeat the same Tailwind chain rather than applying the utility. | High |
| D12 | No dark-mode contrast audit has been performed. Several `text-gray-400` instances on navy-light backgrounds may fail WCAG AA (4.5:1 for small text). | High |
| D13 | No icon system defined. Components mix inline SVG paths and there is no unified icon library. | Medium |
| D14 | No empty state component. Each empty state is individually coded (Opportunities, Lists, etc.) with different visual treatments. | Medium |
| D15 | No loading/skeleton state system. Loading states use one-off `animate-pulse` blocks of various heights. | Medium |
| D16 | No defined CTA hierarchy. Primary, secondary, ghost, and destructive button intents are inconsistently implemented. | High |

### Missing tokens (need to define)

- Typography scale (display, h1–h4, body-lg, body, body-sm, caption, label)
- Spacing scale (or confirm Tailwind default is the source of truth)
- Shadow tokens (card shadow, elevated shadow, gold glow)
- Gradient tokens (hero gradient, card gradient, gold shimmer)
- Focus ring standard (currently `focus:border-gold` but no ring utility)
- Transition tokens (duration, easing)
- Z-index scale (nav=30, modal=50, toast=60 etc. — currently ad-hoc)

---

## 3. Public Marketing Website

### Architecture

There are **two landing pages**:
1. `apps/marketing/src/app/page.tsx` — served on `footycontacts.com`
2. `apps/web/src/app/page.tsx` — served on `app.footycontacts.com/` (shown to logged-out visitors)

Both are similar minimal pages. Neither is the definitive marketing homepage.

### Current homepage structure (marketing site)

| Section | Present | Quality |
|---------|---------|---------|
| Navbar | ✅ | Minimal: wordmark + Blog link + Sign in + Get started |
| Hero | ✅ | Headline + subheadline + 2 CTAs |
| Data proof strip | ❌ | Missing entirely |
| Feature grid | ✅ | 3 cards: contacts / search / unlock |
| How it works | ❌ | Missing |
| Who it's for | ❌ | Missing |
| Emotional/aspirational section | ❌ | Missing |
| Pricing teaser | ❌ | Missing |
| Testimonials / social proof | ❌ | Missing |
| Footer | ❌ | Not present on marketing site |
| Search/demo preview | ❌ | Missing |

### Issues found

| # | Issue | Severity |
|---|-------|----------|
| M1 | Hero headline: "Football contact intelligence at your fingertips" is weak. It describes a feature, not a transformation. It does not make a visitor feel anything or understand why they should care. | Critical |
| M2 | Subheadline says "50,000+ verified contacts" — this is inaccurate. Not all contacts are verified. Should say "42,000+ contacts with email fields" or similar accurate language. | High |
| M3 | "Trusted by thousands of football industry professionals" — claim appears on both landing pages. With 743 registered users this is misleading. Must be removed or rewritten accurately. | Critical |
| M4 | No data proof strip. Key differentiators (55k contacts, 114 countries, 42k emails, 47k phones, 55k LinkedIn) are not shown anywhere on the homepage. | High |
| M5 | No "How it works" section. Visitors have no mental model of the product loop: search → unlock → contact. | High |
| M6 | No "Who it's for" section. No user can quickly recognise themselves as the target audience. | High |
| M7 | No pricing teaser. Visitors cannot understand cost before signing up, creating friction and distrust. | High |
| M8 | No footer on marketing site. No legal links (Privacy, Terms), no nav, no social links. | Medium |
| M9 | CTA copy "Start for free" and "Get started" are generic. No mention of 3 free unlocks. No reason to act now. | High |
| M10 | "Read the blog" secondary CTA competes visually with the primary CTA and sends users away from the conversion goal. | Medium |
| M11 | No visual product preview or screenshot. Visitors cannot see what they are signing up for. | High |
| M12 | Navbar has no Pricing link, no Features link, no "How it works" link. | Medium |
| M13 | Wordmark only in navbar — no logomark/icon alongside. | Low |
| M14 | Marketing CSS uses inline hex values rather than Tailwind brand tokens, causing maintenance drift. | Medium |
| M15 | No Open Graph image defined. Social sharing will show no preview card. | Medium |
| M16 | No structured data / JSON-LD. | Low |
| M17 | No footer on web app landing page either (`apps/web/src/app/page.tsx`). | Medium |
| M18 | Web app landing page (at `app.footycontacts.com/`) is an entirely separate simpler page from the marketing site — this split is confusing and inconsistent. | High |

---

## 4. Sign Up Page

### Current implementation

**File:** `apps/web/src/app/signup/page.tsx`

- Client component (`"use client"`)
- Offers: Google OAuth + email/password
- On success: renders an inline "Check your email" state (no separate route)
- No separate route for post-signup confirmation

### Issues found

| # | Issue | Severity |
|---|-------|----------|
| S1 | Google OAuth is present but the product specification requires **email + password only**. Google OAuth must be removed or disabled. | High |
| S2 | No password strength indicator. `minLength={8}` is the only validation. No complexity requirement shown. | Medium |
| S3 | Heading: "Create your account" — does not reinforce the product or reason to sign up. | Medium |
| S4 | No context copy. A new user sees a blank form with no reminder of what they get (3 free unlocks, access to 55k contacts etc.). | High |
| S5 | No "3 free unlocks included" trust line near the CTA. | High |
| S6 | No trust indicators: no "No credit card required", no "Cancel anytime", no data security mention. | Medium |
| S7 | Email confirmation state is an inline conditional render — not a dedicated screen. The user cannot share or bookmark a confirmation page. | Low |
| S8 | Email confirmation screen shows only "Check your email / We sent a confirmation link." — no resend button. | High |
| S9 | No "Already have an account? Sign in" link in the form body (only below the card in the original template). Audit of final code: link exists at bottom but is not prominent. | Medium |
| S10 | Duplicate rendering of the form content — the component renders the Google button twice (the `sent` state and main state share the same layout file but the main body repeats the card). This is a copy-paste artifact in the code. | Medium |
| S11 | No CSRF protection on the client-side form. Relies entirely on Supabase SDK (acceptable for this stack, but worth noting). | Low |
| S12 | Page background uses `bg-navy` (#222C41) rather than `bg-navy-dark` (#161E2E). Auth pages should use the deepest background for contrast. | Low |
| S13 | No mobile-specific layout. The `max-w-sm` container works on mobile but there is no visual differentiation between mobile and desktop experiences. | Low |

---

## 5. Sign In Page

### Current implementation

**File:** `apps/web/src/app/login/page.tsx`

- Client component
- Google OAuth + email/password
- On success: `router.refresh()` — relies on middleware to redirect

### Issues found

| # | Issue | Severity |
|---|-------|----------|
| L1 | Google OAuth present — must be removed per specification. | High |
| L2 | Heading: "Sign in to your account" — generic, no brand tone. | Medium |
| L3 | On successful login: `router.refresh()` is called. This triggers a full page refresh. Middleware then redirects to `/app`. This is functional but causes a flash. A direct `router.push("/app")` would be smoother. | Low |
| L4 | "Forgot password?" and "Create account" links are rendered in a small `text-gray-400` footer below the card — low visibility, easy to miss. | Medium |
| L5 | No "Welcome back" messaging or product reminder for returning users. | Low |
| L6 | Error message exposes raw Supabase error strings (e.g. "Invalid login credentials"). Should be normalised to user-friendly copy. | Medium |
| L7 | Background `bg-navy` not `bg-navy-dark`. | Low |

---

## 6. Password Reset & Auth Flows

### Forgot password page

**File:** `apps/web/src/app/forgot-password/page.tsx`

- Sends reset email via `supabase.auth.resetPasswordForEmail`
- Redirects to `/auth/callback?next=/app/profile/reset-password`
- On success: shows "Check your email" inline state
- No resend mechanism
- No "back to sign in" on the post-send state (link present, confirmed)

### Auth callback

**File:** `apps/web/src/app/auth/callback/route.ts`

- Handles: `token_hash + type=recovery` (password reset) and `code` (OAuth / magic link PKCE)
- Password recovery: verifies OTP, redirects to `/auth/update-password`
- OAuth: exchanges code, redirects to `/app`
- On failure: redirects to `/login?error=auth_callback_failed` or `/login?error=invalid_reset_link`

### Issues found

| # | Issue | Severity |
|---|-------|----------|
| A1 | Forgot password success screen shows "Check your email" but there is no resend link. If the email is delayed or lands in spam, the user is stuck. | High |
| A2 | Auth callback does not handle the `next` query param from the forgot-password redirect. The `next=/app/profile/reset-password` parameter is lost when the code exchange succeeds because the callback unconditionally redirects to `/app`. The user must navigate to their profile manually to set a new password. | Critical |
| A3 | No email verification gate exists anywhere in the current flow. A user can sign up, skip email confirmation, complete onboarding, and start unlocking contacts without ever verifying their email. | Critical |
| A4 | Google OAuth callback redirects to `/app` — if onboarding is not done, middleware catches this correctly. However, Google OAuth users never receive an email verification prompt from the product (Google verifies for them). This is acceptable but should be documented. | Low |
| A5 | Error query params on `/login` (`?error=auth_callback_failed`) are not read or displayed on the login page. Users who land there after a failed auth will see no explanation. | High |
| A6 | The `/auth/update-password` route exists but was not fully audited. It should be reviewed to confirm it requires an active recovery session before accepting a new password (prevent CSRF/token replay). | Medium |

---

## 7. Email Verification Flow

### Current state

There is **no email verification gate in the product**.

The current flow is:
1. User signs up → Supabase sends a confirmation email
2. User does not need to click the link
3. Onboarding runs without any email check
4. User can unlock contacts without email verification

The confirmation email is sent by Supabase as part of `signUp()` with `emailRedirectTo` pointing to `/auth/callback`. If the user clicks the link they are signed in. But the product never checks `email_confirmed_at`.

### Issues found

| # | Issue | Severity |
|---|-------|----------|
| V1 | No verification gate before first unlock. Any email address (including disposable/fake) can create an account and use free unlocks. | Critical |
| V2 | No "verify your email" prompt shown anywhere in the onboarding or dashboard. Users who sign up and never click the confirmation link are in limbo — they have an unverified session but full product access. | High |
| V3 | No resend verification email flow. If the email expires or is missed, the user has no way to trigger a new one from the UI. | High |
| V4 | No indication to the user that their email is unverified anywhere in the UI. | High |
| V5 | This is the most significant abuse vector: a bot/scraper can create unlimited accounts and use 3 free unlocks per account without ever verifying an email. | Critical |

---

## 8. Onboarding Flow

### Current implementation

**File:** `apps/web/src/app/onboarding/page.tsx` (single large file, ~700+ lines)

**Steps:**
- Step 1: First name + Last name + User type (player / agent / club / scout / media / other) — 6 user types
- Step 2: Primary goals — multi-select from 8 goals (with emoji icons)
- Step 3: Country (full world list ~200 countries) + City + Football level (5 levels)
- Step 4: "Get started" completion screen

**On complete:** upserts to `profiles` table with `onboarding_completed: true`, redirects to `/app`.

**Middleware:** if `onboarding_completed === false`, any `/app/*` route redirects to `/onboarding`. Once complete, prevents re-entering `/onboarding`.

### Issues found

| # | Issue | Severity |
|---|-------|----------|
| O1 | Entire onboarding is one 700+ line file. All steps, constants, types, and step sub-components live in a single `page.tsx`. This is a maintenance and readability problem. | High |
| O2 | **No email verification step within onboarding.** This is the appropriate place to prompt or gate verification before the user reaches the app. | Critical |
| O3 | Step 2 (Goals) uses emoji in goal labels (`"🤝"`, `"🔭"` etc.) but they render as corrupted characters in the source file (encoding artifact: `ðŸ¤`, `ðŸ"­`). This will cause rendering issues in some environments. | Critical |
| O4 | Country dropdown is an unfiltered `<select>` with ~200 options — no search/filter capability. For a global product this is very poor UX. | High |
| O5 | Onboarding data is **stored but not used** to personalise the dashboard or suggest searches. The redirect lands the user on the same empty search page regardless of their answers. | High |
| O6 | No skip mechanism. Users are required to enter first name, last name, and a user type before they can proceed. There is no "skip for now" on any step except step 2 (Goals) which may be skippable by selecting nothing. Confirm: there is no explicit skip button. | Medium |
| O7 | No explicit explanation of why each question is being asked. The copy "Tell us about yourself so we can personalise your experience" is generic. | Medium |
| O8 | "Football level" options on Step 3: Amateur, Semi-professional, Professional, International, Youth Academy — no "Not applicable" or "Other" for non-player roles. | Low |
| O9 | Step 4 is just a "Get started" completion screen with no preview of what to expect. No suggested first actions, no "here's what you unlocked", no excitement. | High |
| O10 | Onboarding happens **before** email verification but **after** signup. The post-onboarding redirect goes directly to `/app`, bypassing any verification gate. | Critical |
| O11 | Background colours in onboarding (`bg-[#080c17]`, `bg-[#111827]`) are outside the defined brand palette and inconsistent with the rest of the app. | Medium |
| O12 | Progress bar and step labels are functional but visually minimal. No branded icon or illustration per step. | Low |

---

## 9. Logged-In Home / Dashboard

### Current implementation

**File:** `apps/web/src/app/app/page.tsx`

The logged-in home is **the search page**. There is no separate home/dashboard view. After onboarding, users land directly on the contacts search interface.

**What the user sees on first visit:**
- `WelcomeBanner` — shown once to free users, client-side dismissed via localStorage. Shows unlock count + upgrade CTA.
- Sticky search bar (`SearchBar`)
- Filter bar (`SearchFilters`)
- Paginated contact list (`ContactsList`)

The `WelcomeBanner` contains the only first-time user guidance. It disappears after dismissal and is never shown again.

### Issues found

| # | Issue | Severity |
|---|-------|----------|
| H1 | There is no dedicated dashboard/home page. The dashboard IS the search page. This means a new user lands on a contact list with no clear "start here" prompt beyond the banner. | High |
| H2 | `WelcomeBanner` disappears after first dismiss and is stored in `localStorage`. If the user clears storage, or views on another device, it reappears incorrectly. Should use a database flag. | Medium |
| H3 | First-time users get no personalised search suggestions based on their onboarding answers. If a user said they are a player looking for agents in England, they should see suggested searches pre-populated. | High |
| H4 | No "recent searches" or "saved searches" feature on the home screen. Every visit starts from scratch. | Medium |
| H5 | On mobile, the WelcomeBanner is visible but the search placeholder text is "Search scouts, clubs, agents, academies…" — generic, not personalised. | Medium |
| H6 | The unlock widget (remaining unlocks) is only visible in the nav widget — not visible as a prominent card or stat on the home page. New users may not notice it. | Medium |
| H7 | Free users are hard-capped to page 1 of results on the server (`const page = isFree ? 1 : ...`). This is good security but there is no UI message explaining the restriction. Users just see no page 2. | High |
| H8 | Empty states: if a search returns 0 results, the display shows nothing. There is no empty-state component with helpful suggestions. | Medium |
| H9 | No "quick actions" or shortcut cards visible. No visual path to Opportunities, My Lists, or billing without navigating the nav. | Medium |

---

## 10. Logged-In Navigation

### Current implementation

**TopNav** (`apps/web/src/app/app/TopNav.tsx`):
- Sticky, height 56px (`h-14`), `bg-navy` background with `border-b border-navy-light`
- Logo (left) + Nav links (desktop) + UnlocksWidget + Profile dropdown
- Nav links: **Search**, **Opportunities**, **My Lists**
- Dropdown: My Profile, Exports, Billing, Settings, Admin (if admin), Sign Out

**BottomNav** (`apps/web/src/app/app/BottomNav.tsx`):
- Fixed mobile-only bar, height 64px (`h-16`)
- Tabs: Search, Opportunities, Lists, More (sheet)
- More sheet: profile, exports, billing, settings, admin, sign out

### Issues found

| # | Issue | Severity |
|---|-------|----------|
| N1 | "Exports" is in the profile dropdown (desktop) and the "More" sheet (mobile) — it is not a top-level nav item. For a feature users will return to, this is too buried. | Medium |
| N2 | "Billing" / Upgrade path is also buried in the dropdown and the More sheet. For conversion, the upgrade CTA should be more visible — especially for free users. | Medium |
| N3 | Logo in the nav is `<img src="/logo.png">` with `h-7` sizing. No `loading="eager"` priority or `<Image>` component. The logo dimensions are unknown — not optimised. | Low |
| N4 | Active nav state uses `bg-navy-light` with full-width background on desktop. On mobile, active tab uses `text-gold` only. These two states are visually inconsistent. | Low |
| N5 | No breadcrumbs on inner pages (e.g. contact detail page, billing page). The back navigation is a plain `<a href="/app">` anchor (not `<Link>`), which causes a hard reload. | Medium |
| N6 | Opportunities and Lists are nav items but both can appear empty for new users, creating a dead-end experience for first-time visitors. | High |
| N7 | The profile dropdown relies on a `useRef` click-outside handler. This is functional but a shared `Dropdown` component would be cleaner and reusable. | Low |

---

## 11. Search Experience

### Current implementation

**Search page:** `apps/web/src/app/app/page.tsx` (server component)  
**SearchBar:** `apps/web/src/app/app/SearchBar.tsx` (client)  
**SearchFilters:** `apps/web/src/app/app/SearchFilters.tsx` (client)  
**ContactsList:** `apps/web/src/app/app/ContactsList.tsx` (client)  
**ContactRow:** `apps/web/src/app/app/ContactRow.tsx` (client)  
**ContactPreview:** `apps/web/src/app/app/ContactPreview.tsx` (client)

**Query approach:**
- Server-side Supabase query with URL search params for all filters
- Debounced client-side navigation on search input (350ms)
- 25 results per page (`PAGE_SIZE = 25`)
- Free users: hard-capped to page 1 server-side
- Countries list cached with `unstable_cache` for 1 hour (good)
- Supports: text search, role include/exclude (multi-value CSV), org include/exclude (multi-value CSV), city, country, email_status, category, has_phone, sort, page

**Contact row columns fetched:**
```
id, name, role, organisation, category, country, city,
verified_status, has_email, has_phone, has_linkedin,
role_category, organisations(logo_url, domain)
```
No sensitive fields (email, phone, linkedin_url) are included in the list query. ✅

### Issues found

| # | Issue | Severity |
|---|-------|----------|
| SR1 | No suggested searches for first-time users. The search page opens blank with no defaults or pre-populated suggestions from onboarding. | High |
| SR2 | `SearchFilters` is a single large component (~400+ lines estimated). The filter drawer, staged state management, and URL navigation are all co-located. | Medium |
| SR3 | Filter drawer uses a local staged state that only applies on "Apply" click. This is correct UX but there is no visual indicator that staged filters differ from applied filters. | Low |
| SR4 | The `CONTACT_COLUMNS` constant is defined as a `const` string at module level. This is fine, but there is no type safety between the column names and the `ContactListRow` type. | Low |
| SR5 | `ContactPreview` fetches no additional data server-side — it shows the same fields from the list row. The "View full profile" link goes to `/app/contacts/[id]` which loads the full contact. The split between preview and full page is a good pattern. | Positive |
| SR6 | On mobile, `ContactPreview` is a fixed overlay panel (good). On desktop it's a sticky side panel (good). But the layout shift when the panel opens/closes on desktop is not accounted for — the list column width changes. | Low |
| SR7 | The `CATEGORY_COLORS` object is duplicated between `ContactRow.tsx` and `ContactPreview.tsx`. | Low |
| SR8 | No analytics events fired on search, filter, or contact view. No funnel data is being collected. | Critical |
| SR9 | `escapeLike` function exists in `page.tsx` to prevent SQL injection via LIKE parameters. However, for multi-value parameters the `.or()` Supabase call constructs strings with user input. The `escapeLike` function is applied — this looks correct. Needs careful review that all paths escape properly. | Medium |
| SR10 | The free-user page cap (page 1 only) has no user-facing explanation. Users who reach the end of page 1 results see the pagination numbers but clicking page 2 silently reloads page 1. | High |

---

## 12. Contact Detail & Unlock Flow

### Current implementation

**Contact detail page:** `apps/web/src/app/app/contacts/[id]/page.tsx` (server component)  
**Unlock button:** `apps/web/src/app/app/contacts/[id]/UnlockButton.tsx` (client)  
**Unlock API:** `apps/web/src/app/api/contacts/[id]/unlock/route.ts`

**Data fetching on contact page:**
```typescript
// Uses user's Supabase client (RLS applies)
await supabase.from("contacts").select("*, organisations(logo_url, domain)")
  .eq("id", id).eq("visibility_status", "published").single()
```

**Security concern:** The `select("*")` on the contacts table with the user's Supabase client returns **all columns** for published contacts, **regardless of whether the contact is unlocked**. This means the full contact record — including `email`, `phone`, `linkedin_url` — is returned in the server response even before unlock. The display is gated by the `isUnlocked` conditional, but the **data is in the page HTML**.

**Unlock API:**
- Rate limited: 20/user/minute (Upstash Redis), 200/user/day
- Calls `unlock_contact(p_contact_id)` Postgres RPC — entitlement logic is server-side ✅
- Returns structured error codes: `upgrade_required` (402), `limit_reached` (429)
- `contact_views` insert is fire-and-forget for scraper detection ✅

**Unlock button states:**
- Default: "🔓 Unlock contact" button
- Loading: "Unlocking…"
- Success: page refresh (shows unlocked fields)
- Limit reached (429): "Unlock limit reached" card with upgrade CTA
- Paywall (402): "Upgrade to unlock" card with upgrade CTA
- Generic error: red text with "Please try again"

### Issues found

| # | Issue | Severity |
|---|-------|----------|
| U1 | **CRITICAL SECURITY:** `select("*")` on the contacts table returns all columns including `email`, `phone`, `linkedin_url` to the server component. These values are embedded in the server-rendered HTML of the page. Even though the UI conditionally hides them, the data is present in the DOM source. A user can inspect the page source or network response and extract contact details without consuming an unlock. | Critical |
| U2 | No email verification check before allowing unlock. An unverified account can unlock contacts. | Critical |
| U3 | Unlock button uses emojis (`"🔓 Unlock contact"`, `"📊"`, `"🔒"`) — these are inconsistent with the rest of the UI which uses SVG icons. | Low |
| U4 | The "limit reached" and "paywall" states render in-place within the contact detail page. This is functional but visually disconnected — no modal, no overlay. The card appears below the locked fields. | Medium |
| U5 | After a successful unlock, `router.refresh()` is called and the page reloads. The full contact fields then become visible. There is no success animation, no confirmation message, no "you've used X unlocks" feedback. | Medium |
| U6 | `window.dispatchEvent(new Event("unlocks-updated"))` is fired after unlock to update the `UnlocksWidget`. This is a non-standard event-bus pattern. It works but creates implicit coupling. | Low |
| U7 | Back navigation on contact detail page uses `<a href="/app">` (hard anchor) rather than `<Link>` or `router.back()`. This triggers a full page reload. | Low |
| U8 | The contact detail page queries the `organisations` table via a foreign key join. If the `organisations` record is missing, `orgLogoUrl` will be null — this is handled gracefully. ✅ | N/A |
| U9 | The "Uses 1 unlock from your plan allowance" microcopy below the unlock button is small and `text-gray-500` — easy to miss. | Low |

---

## 13. Opportunities & Trials

### Current implementation

**File:** `apps/web/src/app/app/opportunities/page.tsx`

- Queries `opportunities` table from Supabase, filtered by `status = 'live'`
- If no results: shows "No active opportunities at the moment." in `text-gray-500`
- Linked from TopNav and BottomNav

### Issues found

| # | Issue | Severity |
|---|-------|----------|
| OP1 | Empty state is a single line of grey text. There is no CTA, no explanation, no "coming soon" message, no way for the user to express interest or be notified. | High |
| OP2 | It is unclear how many live opportunities currently exist in the database. If the count is zero, this is a dead page in the nav that will frustrate new users. | High |
| OP3 | No individual opportunity detail page was found in the route tree (`/app/opportunities/[id]`). The list items link to `href={/app/opportunities/${opp.id}}` but no page exists to handle this. This is a 404 on click. | Critical |
| OP4 | No filtering, no search, no category grouping on the opportunities page. | Medium |
| OP5 | Premium opportunities have a `is_premium` flag and show a gold badge — but there is no lock/paywall mechanism shown. What happens if a free user clicks a premium opportunity? | Medium |
| OP6 | Trials are mentioned in product positioning but there is no separate Trials section, table, or concept in the codebase. All opportunities and trials are in one `opportunities` table with a `type` field. | Medium |

---

## 14. Billing & Upgrade

### Current implementation

**Billing page:** `apps/web/src/app/app/billing/page.tsx`  
**UpgradeModal:** `apps/web/src/app/app/UpgradeModal.tsx`  
**Checkout API:** `apps/web/src/app/api/billing/checkout/`  
**Stripe portal API:** `apps/web/src/app/api/billing/portal/`  
**Stripe webhook:** `apps/web/src/app/api/webhooks/`

**Plans defined (in UpgradeModal):**
| Plan | Monthly | Yearly | Unlocks | Exports |
|------|---------|--------|---------|---------|
| Free | £0 | - | 3 lifetime | - |
| Pro | £39/mo | £390/yr (£78 saving) | 150/month | 75/month |
| Agency | £149/mo | £1,490/yr (£298 saving) | Unlimited | 500/month |

**Upgrade CTA entry points:**
- `WelcomeBanner` → "Upgrade" button → `UpgradeModal`
- `UnlocksWidget` dropdown → "Upgrade to Pro / Agency"
- `UnlockButton` paywall/limit states → "View plans" → `/app/billing`
- `/upgrade` page → auto-redirects to Stripe with COMEBACK50 coupon

### Issues found

| # | Issue | Severity |
|---|-------|----------|
| B1 | `UpgradeModal` hard-codes plan prices, features, and labels as JS constants. If prices change, this must be manually updated. Should ideally read from the `plans` table. | Medium |
| B2 | The Free plan's "3 lifetime unlocks" (not monthly) is a key conversion differentiator, but this is never clearly communicated. The WelcomeBanner says "3 free unlocks" which sounds monthly. | High |
| B3 | Yearly billing toggle exists in `UpgradeModal` but not on the billing page. Inconsistent. | Medium |
| B4 | No "Feature comparison table" between plans. Users cannot quickly compare what each plan includes. | Medium |
| B5 | No social proof, testimonial, or urgency signal near upgrade CTAs. | Medium |
| B6 | Agency plan features list includes "3 team seats" — this functionality does not appear to exist in the app. This could be a misleading claim if team seats are not implemented. | High |
| B7 | `/upgrade` page (reactivation campaign redirect) renders a plain white screen with "Preparing your upgrade…" text — completely off-brand during what should be a re-engagement moment. | Medium |

---

## 15. Component Architecture

### Current structure

```
apps/web/src/
├── components/
│   ├── CookieConsent.tsx        # Cookie banner
│   └── SaveToListButton.tsx     # Save contact to a list
├── lib/
│   ├── email/                   # Email sending utilities
│   ├── orgLogo.ts               # Org logo URL resolver
│   ├── rate-limit.ts            # Upstash Redis rate limiter
│   ├── secrets.ts               # Secret fetching
│   ├── stripe.ts                # Stripe client
│   ├── supabase/
│   │   ├── client.ts            # Browser Supabase client
│   │   ├── server.ts            # Server Supabase client
│   │   └── admin.ts             # Service-role admin client
│   └── utils.ts                 # Utility functions
└── app/
    └── app/                     # All logged-in app components co-located here
```

### Issues found

| # | Issue | Severity |
|---|-------|----------|
| C1 | There are only **2 shared components** in `/components/` (`CookieConsent`, `SaveToListButton`). All other UI components live inside `/app/app/` — they are route-specific and not reusable. | High |
| C2 | No shared UI library (`/components/ui/`). No Button, Input, Card, Badge, Modal, Dropdown, Avatar, Spinner, or Skeleton components exist as reusable primitives. All patterns are repeated inline. | Critical |
| C3 | No marketing component layer (`/components/marketing/`). Homepage, auth pages, and public pages all build their UI from scratch with inline Tailwind. | High |
| C4 | No auth component layer (`/components/auth/`). Sign in, sign up, forgot password, and onboarding have no shared layout, card, or input components. | High |
| C5 | `CATEGORY_COLORS` is duplicated in `ContactRow.tsx` and `ContactPreview.tsx`. | Low |
| C6 | `ContactRow.tsx` contains `OrgAvatar`, `SignalPill`, and `ContactCTA` as module-level functions. These should be proper sub-components or extracted. | Low |
| C7 | Onboarding step components (`Step1`, `Step2`, `Step3`, `Step4`) are defined as module-level functions at the bottom of `onboarding/page.tsx`. They should be separate files. | High |
| C8 | `UnlockWallModal.tsx` is a thin wrapper around `UpgradeModal.tsx` with no additional logic — likely not needed. | Low |
| C9 | ReactQuery (`@tanstack/react-query`) is installed and configured in `providers.tsx` but **appears to be unused** — no `useQuery` or `useMutation` calls were found in the audited files. The `UnlocksProvider` uses raw `fetch` + `useState`. | Medium |
| C10 | No form validation library. Validation is ad-hoc (HTML5 `required`, `minLength`). No Zod schemas, no React Hook Form. | Medium |
| C11 | No design token file (TypeScript). Brand values live only in CSS. No way to reference tokens in JS/TS contexts (e.g. for charting, animation, or generated styles). | Medium |

---

## 16. Security Assessment

### Authentication & session

| # | Finding | Severity |
|---|---------|----------|
| SEC1 | **No email verification gate before contact unlock.** Any account (including disposable email) can unlock contacts. | Critical |
| SEC2 | **Contact detail page returns all fields in server HTML via `select("*")`**, including email, phone, and LinkedIn URL, before the user has unlocked the contact. The UI hides them conditionally but the data is in the DOM. A basic page-source inspection or network tab reveals gated fields. | Critical |
| SEC3 | Middleware skips all `/api/*` routes: "API routes — skip middleware auth entirely, each route handles its own auth." This is architecturally sound if every API route independently verifies the user session, but it means there is no centralised guarantee. | Medium |
| SEC4 | The unlock API rate limits: 20/user/minute (Redis) and 200/user/day (Redis). If Redis is unavailable, the fallback is to **allow the request** ("fail open"). This means during Redis outages, rate limits are completely bypassed. | High |
| SEC5 | Export API rate limits: 1 export per user per hour (Redis). Same fail-open concern. | Medium |
| SEC6 | The `createAdminClient()` (service-role key) is imported directly in server components and API routes. If any server component is accidentally made a client component, or if an import chain is misconfigured, service-role access could be exposed. Needs regular audit. | Medium |
| SEC7 | Middleware fetches the full profile on every authenticated request (`select("*")` on profiles). This is a broad select and adds latency. Should select only `role, is_suspended, onboarding_completed`. | Low |
| SEC8 | `contact_views` insert (scraper detection) is fire-and-forget: `.then()` with no error handling. If it fails silently, view tracking is lost. | Low |
| SEC9 | Admin routes protected by `userRole !== 'admin'` check in middleware — this is correct. The admin client uses service-role key and is only used server-side. ✅ | Positive |
| SEC10 | Rate limiter uses `user.id` as the key, which is correct. However, pre-authentication endpoints (login, signup) are not rate limited at the application layer — relies on Supabase's built-in rate limiting for auth. | Medium |
| SEC11 | No CSP (Content Security Policy) headers were found. No security headers configuration in `next.config.ts` or Vercel config. | High |
| SEC12 | The `resetPasswordForEmail` redirect URL is constructed client-side using `location.origin`. This is safe as it is validated by Supabase's allowed redirect URLs, but should be confirmed in the Supabase dashboard. | Low |
| SEC13 | Audit log table exists (`/admin/audit-logs/`) — good. Whether unlock/export actions are fully logged needs further DB-level verification. | Medium |

---

## 17. Analytics & Activation Tracking

### Current state

**No analytics or event tracking was found anywhere in the codebase.**

There is no:
- Google Analytics / GA4
- Mixpanel / PostHog / Segment
- Custom event firing
- Funnel instrumentation
- TTFU measurement (time-to-first-unlock)
- Conversion tracking

`instrumentation.ts` exists at root and in `apps/web/src/` — these are Sentry instrumentation files for error tracking only, not product analytics.

### Missing events (full list)

| Event | Where to fire |
|-------|--------------|
| `homepage_viewed` | Marketing home page load |
| `hero_cta_clicked` | Homepage hero button |
| `signup_started` | Signup page load |
| `signup_completed` | After `supabase.auth.signUp` success |
| `email_verification_sent` | After signup success |
| `email_verified` | After `/auth/callback` code exchange |
| `onboarding_started` | Onboarding step 1 load |
| `onboarding_step_completed` | On each `nextStep()` call |
| `onboarding_completed` | After `complete()` upsert success |
| `dashboard_viewed` | On `/app` page load |
| `search_performed` | On search navigation |
| `filter_applied` | On filter apply |
| `contact_viewed` | On contact detail page load |
| `unlock_attempted` | On `handleUnlock()` call |
| `contact_unlocked` | After unlock API returns success |
| `free_unlocks_exhausted` | When limit state is shown |
| `upgrade_prompt_viewed` | When UpgradeModal is shown |
| `upgrade_cta_clicked` | On plan selection in UpgradeModal |
| `checkout_started` | After checkout API responds with URL |
| `subscription_created` | Via Stripe webhook |
| `export_attempted` | On export POST |
| `opportunity_viewed` | On opportunities page load |

### TTFU definition (not yet implemented)

**TTFU** = time from `onboarding_completed_at` (stored on the profiles row) to `first_contact_unlocked_at` (first row in `contact_unlocks` per user).

Both timestamps are theoretically available in the database but no reporting, alerting, or measurement infrastructure exists.

---

## 18. SEO & Performance

### SEO

| # | Finding | Severity |
|---|---------|----------|
| SEO1 | Marketing site has good base metadata (title template, metadataBase, OpenGraph, Twitter card). ✅ | Positive |
| SEO2 | Web app root layout: title is "Footy Contacts — Football Contact Intelligence", description is generic one-liner. No page-specific metadata on inner pages. | Medium |
| SEO3 | No `robots.txt` on marketing site (file not found in audit). Web app has `robots.ts`. | Medium |
| SEO4 | No `sitemap.ts` on marketing site visible in the audit. Web app has `robots.ts`. | Medium |
| SEO5 | No Open Graph image (`og:image`) defined. LinkedIn/Twitter previews will be blank. | High |
| SEO6 | Blog exists at `apps/marketing/src/app/blog/` (Sanity CMS) — good for content SEO. | Positive |

### Performance

| # | Finding | Severity |
|---|---------|----------|
| P1 | Logo served as `logo.png` (`/public/logo.png`) — only one asset in `public/`. No favicon, no `apple-touch-icon`, no `manifest.json`. | High |
| P2 | Logo uses `<img>` tag not Next.js `<Image>` in most places — no automatic optimisation, sizing, or lazy loading. | Medium |
| P3 | Countries list query cached with `unstable_cache` (1 hour). ✅ Good. | Positive |
| P4 | No image assets used on the marketing site or landing page (except logo). The site is fast but visually sparse. | Low |
| P5 | `export const dynamic = "force-dynamic"` on signup and login pages — prevents static generation but is correct for auth pages. ✅ | Positive |
| P6 | `ReactQueryDevtools` is included in the production bundle via `providers.tsx` with no environment guard. This should be `process.env.NODE_ENV === 'development'` only. | Medium |
| P7 | No `<Suspense>` boundaries on the main dashboard page around non-critical content (opportunities, lists, etc.) — though these are not rendered there. Suspense is correctly applied around `SearchBar` and `SearchFilters` in the dashboard. ✅ | Positive |

---

## 19. Summary: Critical Issues by Priority

### P0 — Must fix before any growth investment

| Ref | Issue |
|-----|-------|
| SEC2 / U1 | **Contact fields (email, phone, LinkedIn) returned in page HTML via `select("*")` before unlock. Gating is UI-only. Full data exposure in DOM source.** |
| V1 / A3 | **No email verification gate before contact unlock. Disposable emails can freely use the product.** |
| OP3 | **Opportunities list items link to a route that does not exist — every click is a 404.** |
| O3 | **Emoji encoding corruption in onboarding Step 2 goal labels — renders as garbage characters.** |
| A2 | **Forgot password callback does not honour the `next` redirect param — users cannot complete a password reset.** |

### P1 — Critical for activation and conversion

| Ref | Issue |
|-----|-------|
| M1 / M2 / M3 | Hero headline weak, "verified" overclaim, "thousands of professionals" inaccurate. |
| M4–M9 | Homepage missing: data proof, how it works, who it's for, pricing teaser, footer. |
| SR8 | Zero analytics events anywhere in the codebase. Cannot measure anything. |
| O2 / V2–V5 | No email verification prompt in onboarding or dashboard. |
| O5 | Onboarding answers stored but never used to personalise dashboard or search. |
| H1 | No dedicated dashboard/home page for first-time users — lands on blank search. |
| C2 / C3 / C4 | No shared UI component library. All components are one-offs. |

### P2 — Important for product quality

| Ref | Issue |
|-----|-------|
| D1–D16 | Typography, spacing, shadow, gradient tokens all missing. Inconsistent design system. |
| O1 / C7 | Onboarding is a 700-line single file. All steps need extracting. |
| SR1 / H3 | No suggested searches post-onboarding. |
| B2 / B3 / B4 | Free plan lock type (lifetime not monthly) unclear. No plan comparison table. Yearly toggle missing from billing page. |
| SEC4 / SEC5 | Rate limiter fails open — Redis outage = unlimited unlocks. |
| SEC11 | No CSP or security headers. |
| S1 / L1 | Google OAuth present — needs to be removed per spec. |
| P6 | ReactQueryDevtools in production bundle. |

### P3 — Polish and optimisation

| Ref | Issue |
|-----|-------|
| H2 | Welcome banner dismissal stored in localStorage, not DB. |
| H7 / SR10 | Free users silently capped at page 1 — no UX feedback. |
| N3 / P1 | Logo unoptimised, no favicon, no app manifest. |
| B7 | `/upgrade` reactivation page completely off-brand. |
| U5 | No success animation or feedback after first unlock. |
| OP1 | Opportunities empty state needs redesign. |

---

*End of Phase 0 Audit. The implementation plan (Phase 1 onwards) will address these findings in priority order.*
