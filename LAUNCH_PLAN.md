# Footy Contacts — Full Product Launch Plan

> Version: 3.0 — May 2026  
> Basis: Phase 0 Audit findings + full product vision brief  
> Author: AI Product / Engineering brief — executable by solo founder with AI coding agents  
> Goal: Visitor → Signup → Activated → First Unlock in under 5 minutes → Paying subscriber

---

## Table of Contents

1. [Executive Diagnosis](#1-executive-diagnosis)
2. [Brand & Product Experience Vision](#2-brand--product-experience-vision)
3. [Messaging Hierarchy](#3-messaging-hierarchy)
4. [Homepage Redesign Plan](#4-homepage-redesign-plan)
5. [Sign Up Redesign Plan](#5-sign-up-redesign-plan)
6. [Sign In Redesign Plan](#6-sign-in-redesign-plan)
7. [Email Verification Recommendation](#7-email-verification-recommendation)
8. [Onboarding Redesign Plan](#8-onboarding-redesign-plan)
9. [Logged-In Dashboard Redesign](#9-logged-in-dashboard-redesign)
10. [Navigation Redesign](#10-navigation-redesign)
11. [Search → First Unlock Activation Flow](#11-search--first-unlock-activation-flow)
12. [Opportunities & Trials Strategy](#12-opportunities--trials-strategy)
13. [Visual Design System](#13-visual-design-system)
14. [Image & Asset Strategy](#14-image--asset-strategy)
15. [Copywriting System](#15-copywriting-system)
16. [Security & Abuse Prevention](#16-security--abuse-prevention)
17. [Frontend Architecture](#17-frontend-architecture)
18. [Analytics & Activation Tracking](#18-analytics--activation-tracking)
19. [Implementation Roadmap](#19-implementation-roadmap)
20. [Priority Order](#20-priority-order)
21. [Acceptance Criteria](#21-acceptance-criteria)
22. [Risks & Trade-offs](#22-risks--trade-offs)
23. [Quick Wins vs Deeper Rebuild](#23-quick-wins-vs-deeper-rebuild)
24. [What Not to Build Yet](#24-what-not-to-build-yet)

---

## 1. Executive Diagnosis

### What is currently broken

The product has a working backend, organic traffic, and a real contact database. 743 users have registered. **0 are paying.** 1 unlock has ever been used. Onboarding completion is 0.2%.

This is not a data problem. It is a **product experience and conversion problem**.

The current state fails users at every stage of the funnel:

| Stage | Failure mode |
|---|---|
| Homepage | Generic SaaS template. No identity, no emotional hook, no proof. |
| Sign up | Standard form with no context about what the user is getting. |
| Sign in | Works technically. No "welcome back" energy. |
| Email verification | Does not exist as a product gate. |
| Onboarding | 0.2% completion rate. 700-line single file. Emoji encoding corrupted. Answers stored but never used. |
| Dashboard | Users land on an empty search page. No guidance. No suggested first action. |
| First search | No personalisation from onboarding. No empty state guidance. |
| First unlock | **Critical security gap**: all contact fields including email, phone, and LinkedIn are returned in the server HTML before unlock. UI hides them but a page source inspection reveals everything gated. |
| Opportunities | Links to 404 pages. Table is empty. |
| Upgrade path | Buried. Unclear. Off-brand. |

### Root cause

The product was built to work, not to convert. The auth, onboarding, and dashboard were scaffolded — they function but they don't guide, excite, or activate users.

The emotional promise of the product — **access to the football network you were never handed** — is completely absent from every page a user touches before activation.

### Three priorities to establish first

1. **Fix the critical security leak** (SEC2/U1 from audit): server-side field protection before any growth work.
2. **Create the brand/design system**: gives every subsequent page a consistent vocabulary to build from.
3. **Rebuild the activation funnel**: homepage → sign up → onboarding → dashboard → first unlock.

---

## 2. Brand & Product Experience Vision

### Product identity

Footy Contacts is a **football access platform**.

Not a contacts database. Not a lead-gen tool. Not a football directory.

It is the place where someone who is serious about moving in football goes to find the people, pathways, and opportunities that are otherwise invisible, guarded, or discovered only through years of networking.

The product should feel like:

> "Why did nobody show me this earlier?"

### Brand character

| Dimension | Direction |
|---|---|
| Tone | Direct. Confident. Grounded. Football-native. |
| Aesthetic | Dark premium. Gold accents. Clean typography. Sharp edges. |
| Feel | Serious enough for agents and club staff. Aspirational enough for players trying to break in. |
| Trust signal | Founder-built, real data, real football. Not corporate, not spammy. |
| Emotional positioning | Hope + access + speed. You now know who to contact. |

### What it must never feel like

- Generic SaaS form with a football logo stuck on it
- "Buy contacts" tool
- Cheap lead generation page
- Overclaiming football success guarantees
- Dark mode with poor contrast and illegible text
- Corporate HR platform
- Another football app with stock badges and blurred pitches

### The single product truth

> Football runs on who you know. We make it searchable.

---

## 3. Messaging Hierarchy

### Headline options (ranked by strength)

| # | Headline | Why |
|---|---|---|
| **1** | **Football runs on contacts. Now you can find them.** | Factual, direct, immediately understood. No overclaim. |
| 2 | Access the football network you were never handed. | Emotional, aspirational, slightly confrontational — good for the target user. |
| 3 | Find the people who can open the next door. | Benefit-led but slightly vague on what the product does. |
| 4 | Stop guessing who to contact. Search the football industry directly. | Problem-aware angle. Strong for paid search / retargeting. |
| 5 | The football industry is relationship-driven. We make it searchable. | Honest and smart. Slightly long for a hero headline. |

**Recommended hero headline:** `Football runs on contacts. Now you can find them.`  
**Recommended sub-headline:** `Search 12,400+ published football industry contacts — scouts, agents, coaches, academy staff, club officials, media, and more. Unlock direct email, phone, and LinkedIn in seconds.`

### Full messaging hierarchy

#### Homepage hero

- **Headline:** Football runs on contacts. Now you can find them.
- **Sub:** Search 12,400+ published football industry contacts across 114 countries. Scouts, agents, coaches, academy staff, club officials, and more. Start with 3 free unlocks — no credit card needed.
- **Primary CTA:** Get access — it's free
- **Secondary CTA:** See how it works ↓
- **Trust line below CTA:** No credit card required · 3 unlocks included · Cancel anytime

#### Data proof strip

- 55,016 contacts in database
- 12,400+ published and searchable
- 42,614 with email fields
- 47,154 with phone fields
- 54,996 LinkedIn profiles
- 114 countries

Language note: say "email fields", "phone fields", "LinkedIn profiles" — not "verified". Only use "verified" where we have actual email verification status.

#### How it works

1. **Search** — Filter by role, club, country, level. Find exactly who you need.
2. **Unlock** — Use a credit to reveal email, phone, and LinkedIn for any contact.
3. **Reach out** — Contact them directly. No middleman. No guessing.

#### Who it's for

- **Players** — Find scouts, trials, agents, and the clubs looking for your profile.
- **Agents** — Search for club staff, recruitment leads, and new clients.
- **Scouts** — Discover coaches, performance staff, and talent network leads.
- **Coaches** — Find jobs, clubs, and the decision-makers who hire.
- **Media & journalists** — Access football industry contacts across every level.
- **Academy & club staff** — Build recruitment networks and find the people who matter.

#### Emotional section

> Football is full of closed doors. It rewards people who already know someone. If you don't, you're left guessing who to email, hoping your message lands, and watching years pass without the breakthrough you've been working for.
> 
> Footy Contacts exists to change that. Not to guarantee anything — but to remove the guesswork. To show you who is out there, where they work, and how to reach them directly.
> 
> The network is there. You just need access.

#### Pricing framing

- **Free** — Start here. 3 unlocks to find out if this is useful for you.
- **Pro (£39/mo)** — 150 unlocks/month. For serious players, agents, coaches, and scouts who need regular access.
- **Agency (£149/mo)** — Unlimited unlocks and bulk exports. For professional operators who need the full network.

CTA: `Start free — no credit card`

#### Auth pages

- Sign up headline: `Create your access`
- Sign up sub: `Join thousands of football professionals. Start with 3 free contact unlocks.`
- Sign in headline: `Welcome back`
- Sign in sub: `Continue searching the football network.`
- Password reset headline: `Reset your password`
- Password reset sub: `We'll send a reset link to your email address.`

#### Onboarding microcopy

- Step intro: `Let's set up your access`
- Step 1: `Tell us who you are so we can surface the right contacts for you.`
- Step 2: `What are you looking for? We'll use this to suggest the right searches.`
- Step 3: `Which part of the world matters to you? We'll filter contacts accordingly.`
- Completion: `Your access is ready. Here are your first suggested searches.`

#### Unlock flow

- Locked field state: `Unlock to reveal`
- Unlock button: `Unlock contact details`
- Sub-copy: `Uses 1 unlock from your allowance · You have X remaining`
- Post-unlock success: `Contact details unlocked. X unlocks remaining.`
- First unlock ever: `You've unlocked your first contact. This is how it works — find them, unlock them, reach out.`
- All free unlocks used: `You've used your 3 free unlocks. Upgrade to Pro for 150 unlocks/month.`
- Upgrade CTA on wall: `Unlock 150 contacts/month — from £39`

#### Empty states

- Search with no results: `No contacts matched your search. Try broader terms, remove a filter, or search a different role.`
- Opportunities empty: `No opportunities posted yet. New ones are added regularly — check back soon.`
- Saved list empty: `You haven't saved any contacts yet. Start searching and save contacts to build your lists.`

#### Error messages

- Login failed: `That email or password is incorrect. Check your details and try again.`
- Unlock failed (generic): `Something went wrong. Your unlock credit has not been used. Please try again.`
- Rate limit hit: `You've made too many requests. Wait a moment before trying again.`
- Auth callback failed: `Your link has expired or is invalid. Request a new one.`
- Session expired: `Your session has ended. Sign in again to continue.`

---

## 4. Homepage Redesign Plan

### Information architecture

```
Navbar
Hero
Data proof strip
Live search demo / search examples
"What you get access to" feature grid
"Who it's for" persona grid
Emotional access section
How it works
Pricing teaser
Final CTA
Footer
```

### Navbar

**Desktop layout:**
```
[Logo] ── [Features] [Pricing] [Blog] ────────── [Sign in] [Get access →]
```

**Mobile layout:**
```
[Logo] ────────────────── [☰ Menu]
  ↳ drawer: Features · Pricing · Blog · Sign in · Get access
```

**Design:**
- Sticky, height 60px, `bg-navy-dark/95` with `backdrop-blur-sm`
- Logo: gold icon + "Footy" white + "Contacts" gold
- Links: `text-gray-300 hover:text-white` with 14px Inter
- "Sign in": ghost button, `text-white border-navy-light`
- "Get access →": gold filled button `bg-gold text-navy font-semibold`
- On scroll: add `border-b border-navy-light`

### Hero section

**Desktop layout (two-column):**
```
Left (60%)                          Right (40%)
──────────────────────────          ──────────────────
Football runs on contacts.          [Product preview card]
Now you can find them.              showing a blurred/
                                    teaser search result
Search 12,400+ football industry    with name, role, club,
contacts across 114 countries.      country — and a gold
Start with 3 free unlocks.          "Unlock →" button
                                    semi-obscured]
[Get access — it's free]
[See how it works ↓]

No credit card required ·
3 unlocks included
```

**Mobile layout:** Stacked. Headline first, sub-text, CTA buttons, product preview card below fold.

**Design:**
- Background: `bg-navy-dark`, subtle grid texture overlay (CSS `background-image` SVG dot grid, opacity 4%)
- Headline: 56px/64px desktop, 36px mobile, `font-bold`, `text-white`
- "contacts" word in headline: `text-gold`
- Sub-text: 18px, `text-gray-300`, max-width 560px
- Primary CTA: `bg-gold text-navy-dark font-bold px-8 py-4 rounded-xl hover:bg-gold-dark`
- Secondary CTA: `text-gray-400 hover:text-white underline-offset-2` text link with ↓ arrow
- Trust line: `text-gray-500 text-sm`
- Product preview card: `bg-navy-light border border-navy rounded-xl p-4`, shows 3 sample contact rows with locked fields (gold lock icon), gold "Unlock →" button — static/decorative

**Copy:**
```
Football runs on contacts.
Now you can find them.

Search 12,400+ published football industry contacts — scouts, agents,
coaches, academy staff, club officials, and more — across 114 countries.
Start with 3 free unlocks. No credit card needed.

[Get access — it's free]    [See how it works ↓]

No credit card required · 3 unlocks included · Cancel anytime
```

### Data proof strip

**Layout:** Horizontal row of stat tiles, dark card with subtle gold left-border accent.

```
[ 55,016 contacts ] [ 12,400+ published ] [ 42,614 email fields ]
[ 47,154 phone fields ] [ 54,996 LinkedIn ] [ 114 countries ]
```

- Background: `bg-navy-light/50 border-t border-b border-navy`
- Stat number: `text-gold font-bold text-2xl`
- Stat label: `text-gray-400 text-sm`
- Mobile: 2 columns, 3 rows

### Search examples section

**Title:** `See who you can find`

**Layout:** Static grid of example "search query chips" + animated (CSS-only) sample contact card cycling through examples.

**Example searches to display:**
- Scout · England · Premier League
- Agent · Spain · Professional
- Academy Director · League One
- Head of Recruitment · France
- Journalist · Nigeria
- Goalkeeping Coach · Championship

Each chip is clickable and navigates to `sign up` (with query param to pre-populate search after onboarding). The contact card next to it shows a blurred/teased result: name redacted, role visible, organisation visible, gold "Unlock" button.

**Why:** Visitors understand immediately what they can search for. The teaser creates desire. The blur + lock creates intrigue, not frustration.

### "What you get access to" feature grid

**Title:** `One platform. Every connection you need.`

**Grid (2×3 on desktop, 1 column mobile):**

| Icon | Title | Copy |
|---|---|---|
| Network icon | Contacts | Scouts, agents, coaches, academy and club staff, media, recruiters, and football operators. Email, phone, and LinkedIn. |
| Search icon | Direct search | Filter by role, club, country, level, and more. Find exactly the right person without guessing. |
| Unlock icon | Instant access | Unlock a contact's direct details in one click. No intermediary. No waiting. |
| Star icon | Opportunities | Posted trials, jobs, and openings across the football world. Browse and apply directly. |
| Save icon | Saved lists | Build and manage lists of contacts for your outreach campaigns. |
| Export icon | Exports | Download contact lists to CSV for professional outreach and CRM workflows. |

**Design:** Cards with `bg-navy-light border border-navy rounded-2xl p-6`. Icon in gold circle. Title `text-white font-semibold`. Body `text-gray-400`.

### "Who it's for" section

**Title:** `Built for everyone in football`

**Layout:** 4×2 persona tiles on desktop, scrollable row on mobile.

Each tile: role icon + role label + 1-line description + "See how →" micro-link.

| Role | Description |
|---|---|
| Players | Find scouts, agents, trials, and the clubs looking for your profile. |
| Agents | Search club contacts, recruitment leads, and potential clients. |
| Scouts | Discover performance staff, coaches, and talent network leads. |
| Coaches | Find clubs, decision-makers, and job opportunities at every level. |
| Academy staff | Build recruitment networks and access the people who drive youth development. |
| Media & journalists | Find contacts across every level of the game. |
| Recruiters | Access a searchable directory of football operators for your placements. |
| Club operators | Find the professionals you need — faster than relying on referrals alone. |

### Emotional section

**Title:** `Football is a closed network. Until now.`

**Copy:**
> Football runs on relationships. The right call at the right time. Knowing someone who knows someone. If you've ever felt like opportunities were passing you by — not because of ability, but because of access — you're not wrong.
>
> Footy Contacts doesn't guarantee anything. No tool can. But it removes the biggest barrier: not knowing who to contact or how to reach them. We give you the network. You make the move.

**Design:** Full-width dark section, centred text, max-width 720px, gold accent line left border on the blockquote. Subtle background glow behind the text block.

### How it works

**Title:** `Three steps to your next connection`

**Steps (horizontal timeline desktop, vertical mobile):**

1. **Search the network** — Filter by role, club, country, or level. See names, roles, and organisations across 12,400+ published contacts.
2. **Unlock contact details** — Use a credit to reveal direct email, phone, and LinkedIn. Your credit is only used if you confirm.
3. **Reach out directly** — No middleman. You have their details. Make the call, send the email, start the conversation.

**Design:** Three numbered cards connected by a horizontal arrow/line. Each card: dark surface, gold number, white title, gray body.

### Pricing teaser

**Title:** `Start free. Scale when you're ready.`

**Three-column cards:**

| Free | Pro | Agency |
|---|---|---|
| £0 | £39/mo | £149/mo |
| 3 unlocks | 150 unlocks/month | Unlimited unlocks |
| Browse all contacts | 75 exports/month | 500 exports/month |
| No credit card | Annual: £390 | Annual: £1,490 |
| Get access | Start Pro | Go Agency |

**Note on free tier:** The audit reveals `free_unlock_limit = 1` (not 3) in the database. Confirm correct number with the founder before publishing. All copy in this plan uses "3 free unlocks" as stated in the product brief.

### Final CTA section

**Background:** Gradient from `navy-dark` to `navy-light`. Subtle gold glow behind the CTA.

**Headline:** `Give yourself a better shot.`

**Sub:** `Start with 3 free unlocks. No credit card. No commitment. Just access.`

**CTA:** `Get access — it's free →`

**Trust line:** `Join the football professionals already using Footy Contacts.`

### Footer

**Columns:**
- Product: Features, Pricing, Blog, Sign in, Get access
- Legal: Privacy Policy, Terms of Service, Cookie Policy
- Contact: hello@footycontacts.com

**Bottom bar:** © 2026 Footy Contacts. All rights reserved.

**Design:** `bg-navy-dark border-t border-navy`, `text-gray-400`, links `hover:text-white`.

### SEO metadata

```tsx
title: "Footy Contacts — Search the Football Network"
description: "Find scouts, agents, coaches, academy staff, and club contacts across 114 countries. Search 12,400+ published football industry contacts. Start with 3 free unlocks."
openGraph: {
  title: "Footy Contacts — Search the Football Network",
  description: "...",
  image: "/og-image.png",  // 1200×630, dark background, headline + logo
}
```

### Performance notes

- Use Next.js `<Image>` for all images with explicit `width`, `height`, `priority` on hero assets
- Hero product preview card: pure CSS/Tailwind, no external images
- Data proof strip: static HTML, no JS
- Animations: CSS-only transitions only. No GSAP. No heavy animation libraries.
- Font: Inter loaded via `next/font/google` (already configured)
- First Contentful Paint target: under 1.2s on 4G

### Accessibility notes

- Heading hierarchy: h1 (hero headline) → h2 (section titles) → h3 (cards)
- All interactive elements: keyboard focusable with visible gold focus ring
- Colour contrast: all text on navy-dark must pass WCAG AA (4.5:1 minimum)
- Check: `text-gray-400` (#9CA3AF) on `navy-dark` (#161E2E) = contrast ratio ~5.1:1 ✅
- Check: `text-gray-500` (#6B7280) on `navy-dark` = ~3.6:1 ❌ — use `text-gray-400` minimum
- All icons: `aria-hidden="true"` if decorative; `aria-label` if functional

---

## 5. Sign Up Redesign Plan

### Layout

**Desktop:** Two-column split
- Left (40%): Marketing panel — dark, gold accent. Brand reinforcement, trust signals.
- Right (60%): Form panel — clean, white-on-dark form.

**Mobile:** Single column. Marketing panel collapses to a compact header strip above the form.

### Left panel content (desktop only)

```
[Logo]

Create your access

Join football professionals using Footy Contacts to find 
the contacts that move careers forward.

✦ 3 free unlocks included
✦ No credit card required  
✦ Cancel anytime
✦ Email + password — no app install needed

[Subtle product preview / testimonial area]
"I found the scout I needed in 10 minutes."
— Pro subscriber, UK
```

**Design:** `bg-navy-dark` left panel, gold `✦` bullet markers (`text-gold`), white headline, gray body text, subtle gold top-border strip.

### Right panel / form

**Headline (mobile):** `Create your access`  
**Sub (mobile):** `Start with 3 free unlocks — no credit card needed.`

**Fields:**
1. Email address — `type="email"`, `autocomplete="email"`, `placeholder="your@email.com"`
2. Password — `type="password"`, `autocomplete="new-password"`, `placeholder="Create a password"`, show/hide toggle
3. Confirm password — `type="password"`, `autocomplete="new-password"`, `placeholder="Confirm your password"`

**Password requirements (displayed inline below the field):**
```
✓ At least 8 characters
✓ At least one number or symbol
```
Show each rule in gray until met, then gold checkmark when satisfied.

**CTA:** `Create account →` — gold filled, full-width, `bg-gold text-navy-dark font-bold`

**Below CTA:**
```
By creating an account you agree to our Terms of Service and Privacy Policy.
```
Links to `/terms` and `/privacy`. `text-gray-500 text-xs`.

**Below form:**
```
Already have an account? [Sign in]
```

### Post-signup state (same page, conditional render)

Replace form with:
```
[Envelope icon — gold]

Check your inbox

We've sent a confirmation link to [email].
Click it to verify your email and get started.

[Resend email]    [Change email address]

Tip: Check your spam folder if you don't see it within 2 minutes.
```

`Resend email` calls `supabase.auth.resend({ type: 'signup', email })` — show a 60-second cooldown countdown after first resend. Show success toast "Email resent".

### Validation

| Field | Rule | Error message |
|---|---|---|
| Email | Valid format, non-empty | `Enter a valid email address.` |
| Password | Min 8 chars, at least 1 number/symbol | `Password must be at least 8 characters with a number or symbol.` |
| Confirm password | Must match password | `Passwords don't match.` |
| Supabase error: email exists | — | `An account with this email already exists. [Sign in instead]` |

### No Google OAuth

Per specification: email + password only. Remove any existing Google OAuth buttons entirely. Do not show alternative sign-up methods.

### Files affected

- `apps/web/src/app/signup/page.tsx` — full rewrite
- New: `apps/web/src/components/auth/AuthSplitLayout.tsx`
- New: `apps/web/src/components/auth/PasswordField.tsx`
- New: `apps/web/src/components/auth/PasswordStrength.tsx`

---

## 6. Sign In Redesign Plan

### Layout

**Desktop:** Same two-column split as sign up, using `AuthSplitLayout`.  
**Mobile:** Single column.

### Left panel content

```
[Logo]

Welcome back

The football network is waiting.

[Subtle trust line]
Trusted access for football professionals.
```

**Design:** Same as sign up left panel for brand consistency.

### Right panel / form

**Headline (mobile):** `Welcome back`  
**Sub:** `Continue searching the football network.`

**Fields:**
1. Email address
2. Password — with show/hide toggle

**"Forgot password?"** — small link, right-aligned below the password field. `text-gray-400 text-sm hover:text-gold`.

**CTA:** `Sign in →` — gold filled, full-width.

**Below form:**
```
Don't have an account? [Create one — it's free]
```

### Error handling

| Error | User-facing message |
|---|---|
| Invalid credentials | `That email or password is incorrect. Check your details and try again.` |
| Email not confirmed | `Please verify your email first. [Resend verification email]` — with link |
| Rate limited (Supabase) | `Too many sign-in attempts. Wait a moment and try again.` |
| Network error | `Something went wrong. Check your connection and try again.` |

No raw Supabase error strings should be exposed. Normalise all errors in a helper.

### Error query param display

The login page must read the `?error` query param and display a friendly message:

| Param value | Displayed message |
|---|---|
| `auth_callback_failed` | `Something went wrong with your sign-in link. Please sign in manually.` |
| `invalid_reset_link` | `That password reset link has expired. Request a new one below.` |
| Any other value | `There was a problem with your session. Please sign in again.` |

### Files affected

- `apps/web/src/app/login/page.tsx` — rewrite
- Reuse `AuthSplitLayout`, form components from sign up

---

## 7. Email Verification Recommendation

### Recommendation: Option B — Browse and search freely, verify before first unlock

**Rationale:**

The product's gated value is contact details (email, phone, LinkedIn). Browsing and searching cost nothing to show — no data is exposed. The friction point should be exactly at the moment of data exposure.

Requiring verification before entering the app at all (Option A) would increase sign-up abandonment. The user hasn't experienced value yet. There is no reason to verify.

Requiring it only before exports/payment (Option D) leaves contact unlocking (the core product action) unprotected from disposable-email abuse.

Option B is the right balance:

- User signs up → enters onboarding → sees search results (no sensitive data visible)
- User clicks "Unlock" for the first time → verification gate appears if not verified
- User verifies email → returns to app → unlock proceeds
- All subsequent unlocks: no gate (session has `email_confirmed_at`)

### Full verification flow

#### Step 1: Sign up

After successful `signUp()`, the current inline "check your email" state is shown.

User can proceed to onboarding **without verifying first**.

In the Supabase dashboard, configure `signUp` to NOT require email confirmation before session creation (allow `autoConfirm: false` but allow session). This is already the current behaviour — users get a session on signup.

#### Step 2: Onboarding

No verification check during onboarding. User completes 3-step onboarding and is redirected to dashboard.

#### Step 3: Verification nudge on dashboard

On the dashboard, for unverified users, show a persistent (non-dismissable) slim banner at the top:

```
[!] Verify your email to unlock contact details. 
    We sent a link to [email]. [Resend] · [Change email]
```

- `bg-amber-900/40 border-amber-700 text-amber-200`
- Not blocking — user can still search
- Resend button calls `supabase.auth.resend({ type: 'signup', email: user.email })`
- 60s cooldown between resends
- Banner disappears once `email_confirmed_at` is set (re-checked on page load)

#### Step 4: Unlock attempt while unverified

When user clicks "Unlock contact details" and is not verified:

**Do not** proceed with the unlock API call. Instead show an inline verification gate:

```
┌─────────────────────────────────────────┐
│  Verify your email first                │
│                                         │
│  We need to confirm you're human before │
│  revealing contact details.             │
│                                         │
│  Check your inbox for the confirmation  │
│  link we sent to [email].               │
│                                         │
│  [Resend verification email]            │
│  [I've verified — refresh]              │
└─────────────────────────────────────────┘
```

"I've verified — refresh" calls `supabase.auth.refreshSession()` and re-checks `email_confirmed_at`.

This check must happen **client-side before the API call** and also **server-side in the unlock API route** by checking `user.email_confirmed_at` before processing the unlock RPC.

#### Step 5: Email verification callback

`/auth/callback/route.ts` already handles the PKCE exchange on email link click. After successful verification, redirect to `/app?verified=1`.

On the dashboard, if `?verified=1` is present, show a brief success toast: `Email verified. You can now unlock contact details.`

#### Step 6: Expired verification link

`/auth/callback` returns an error if the link is expired. Redirect to `/login?error=invalid_reset_link`. The login page reads this param and shows: `That verification link has expired. Sign in to request a new one.`

### Server-side enforcement

In the unlock API route (`/api/contacts/[id]/unlock/route.ts`):

```typescript
const { data: { user } } = await supabase.auth.getUser()
if (!user?.email_confirmed_at) {
  return NextResponse.json(
    { error: 'email_verification_required' }, 
    { status: 403 }
  )
}
```

This ensures even if the client-side gate is bypassed, the API enforces the rule.

### Abuse prevention notes

- Without this gate, a bot can create unlimited free accounts with disposable emails and use 3 unlocks each.
- With this gate, the attack surface drops dramatically: disposable email services that block verification links cannot be used.
- Consider also: Cloudflare Turnstile on the sign-up form to block automated signups before they reach Supabase.

---

## 8. Onboarding Redesign Plan

### Design principles

- Maximum 3 steps + welcome screen
- Each step has a clear reason shown to the user
- All questions directly improve what they see next
- No questions that aren't used to personalise the product
- Total time to complete: under 2 minutes
- Transition directly to dashboard with pre-populated suggested searches

### Step structure

```
Welcome screen  →  Step 1  →  Step 2  →  Step 3  →  Done screen
```

### Welcome screen

**Not a step** — shown immediately after first login, before the onboarding form.

```
[Logo]

Let's set up your access.

This takes 2 minutes. We'll use your answers to show you 
the right contacts and opportunities from the start.

[Continue →]
```

**Design:** Full-screen dark background, centred card, gold logo icon, white headline, gray sub.

### Step 1: Who are you?

**Headline:** `What best describes you?`  
**Sub:** `We'll use this to surface the most relevant contacts and opportunities.`

**Options (single select, large pill buttons):**
- Player
- Agent / Representative
- Scout / Recruiter
- Coach / Manager
- Club / Academy Staff
- Media / Journalist
- Parent / Guardian
- Other

**Design:** 2×4 grid of pill buttons on desktop, 2-column on mobile. Selected state: `bg-gold text-navy-dark border-gold`. Unselected: `bg-navy-light border-navy text-white hover:border-gold`.

**Required:** Yes. Cannot progress without selecting.

### Step 2: What are you looking for?

**Headline:** `What are you looking for?`  
**Sub:** `Select all that apply. We'll suggest relevant searches.`

**Options (multi-select pills):**
- Scouts
- Agents / Representatives
- Club contacts
- Coaching staff
- Academy contacts
- Media / Press contacts
- Trials / Opportunities
- Job openings

**Required:** No. User can tap "Skip this step" link below the CTA if unsure.

### Step 3: Where are you focused?

**Headline:** `Which region matters most to you?`  
**Sub:** `We'll prioritise contacts from your region.`

**Options (single select):**
- United Kingdom
- Europe
- Africa
- North America
- South America
- Middle East
- Asia / Oceania
- Worldwide (all regions)

**Below region:** Text input — `Your country (optional)` — free text, `placeholder="e.g. England, Nigeria, France"`.

**Required:** No. "Skip this step" available.

### Done screen

**Headline:** `Your access is ready.`  
**Sub:** `Based on your answers, here are your first suggested searches.`

**Suggested searches (3–4 pills, generated from onboarding answers):**

Logic:
```
userType = "Scout" + lookingFor = ["Club contacts"] + region = "UK"
→ suggestions: 
   "Head of Recruitment · Premier League"
   "Club Secretary · Championship"
   "Academy Director · League One"
```

Each suggestion is a clickable pill that navigates to `/app?q=[encoded]&...filters`.

**Below suggestions:**
```
[Go to search →]
```

**Design:** Gold highlighted suggestion chips. Gold "Go to search →" button.

### Onboarding personalisation mapping

Store answers in `profiles` table (existing columns + new if needed):

| Onboarding answer | Profile column | How used |
|---|---|---|
| User type | `user_type` | Filter suggested searches, role-relevant empty states |
| Looking for | `goals` (JSON array) | Suggested search roles |
| Region | `preferred_region` (new column if needed) | Pre-populate country filter |
| Country | `country` | Pre-populate country filter |

### Suggested search generation logic

```typescript
// Server-side, after onboarding completion
function generateSuggestedSearches(profile: Profile): SearchSuggestion[] {
  const base: SearchSuggestion[] = []
  
  const roleMap: Record<string, string[]> = {
    player: ['Scout', 'Agent', 'Head of Recruitment', 'Academy Director'],
    agent: ['Head of Recruitment', 'Chief Executive', 'Technical Director', 'Club Secretary'],
    scout: ['Head of Recruitment', 'Academy Director', 'Performance Director'],
    coach: ['Technical Director', 'Head Coach', 'Academy Director', 'Chief Executive'],
    club_staff: ['Scout', 'Agent', 'Performance Director', 'Head of Recruitment'],
    media: ['Press Officer', 'Media Manager', 'Communications Director'],
  }
  
  const roles = roleMap[profile.user_type] ?? ['Scout', 'Agent', 'Club contact']
  const region = profile.preferred_region ?? null
  
  return roles.slice(0, 4).map(role => ({
    label: region ? `${role} · ${region}` : role,
    params: { q: role, country: region }
  }))
}
```

### Files affected

- `apps/web/src/app/onboarding/page.tsx` — full rewrite, extract to:
  - `apps/web/src/components/onboarding/OnboardingShell.tsx`
  - `apps/web/src/components/onboarding/StepWho.tsx`
  - `apps/web/src/components/onboarding/StepWhat.tsx`
  - `apps/web/src/components/onboarding/StepWhere.tsx`
  - `apps/web/src/components/onboarding/OnboardingDone.tsx`
  - `apps/web/src/lib/onboarding/suggestions.ts`

### Progress bar

3 dots or a 3-segment progress bar. Not steps labeled "Step 1 of 3" — just visual progress. Avoids making users feel like they're in a form wizard.

**Design:** Three segments, completed = `bg-gold`, active = `bg-gold/60`, upcoming = `bg-navy-light`. Width: 240px centred, height 4px, rounded.

### Back button

Each step has a `← Back` text link top-left. No back on step 1.

### Skip logic

- Step 1 (user type): Required — no skip
- Step 2 (looking for): Skip link visible below CTA — `Skip this step →`
- Step 3 (region): Skip link visible

If both steps 2 and 3 are skipped, generate generic suggestions based on step 1 only.

### Emoji fix

The emoji corruption bug (O3 in audit) must be fixed before any production launch. Use text labels only — no emoji in onboarding option labels. Use Heroicons SVG icons alongside text labels if visual differentiation is needed.

---

## 9. Logged-In Dashboard Redesign

### Concept

The logged-in home is **an activation guide, not just a search page**.

The first-time experience is a guided mode. The returning experience gets out of the way.

### First-time user state (onboarding just completed)

**Layout:** Dashboard with a prominent "start here" card at the top, then search below.

```
┌─────────────────────────────────────────────────────────┐
│  Welcome to Footy Contacts                              │
│                                                         │
│  You have 3 free unlocks. Use them to reveal           │
│  direct contact details for any person below.          │
│                                                         │
│  Suggested searches based on your profile:             │
│  [Scout · UK] [Agent · Spain] [Head of Recruitment]   │
│                                                         │
│  [Start searching →]                           [×]     │
└─────────────────────────────────────────────────────────┘

[Search bar]
[Filters]
[Contact list]
```

**Rules:**
- Shown until first search is performed (stored in DB: `profiles.first_search_at`)
- Dismissable with ×, stored in DB (`profiles.dashboard_welcome_dismissed`) not localStorage
- Suggested search chips are generated from onboarding answers
- Clicking a chip navigates to `/app?q=[role]&country=[region]`

### Returning user state (has used the product before)

- No welcome card
- Search bar is focused by default
- Recent searches shown below search bar (last 3, from `saved_searches` or a new `recent_searches` DB column)
- Unlock counter visible as a compact widget in top right of the search area

### Free user state

**Unlock counter card (compact, top-right of search area on desktop, below search bar on mobile):**
```
3 unlocks remaining
████░░░░░░  (3/3)
[Upgrade for 150/month]
```

If 0 remaining:
```
0 unlocks remaining
[Upgrade to keep searching →]
```
`bg-amber-900/40 border-amber-600` — amber warning state.

### Pro user state

- Compact unlock counter: `X / 150 unlocks used`
- No upgrade card — replace with "Exports: X / 75 used"

### Agency user state

- "Unlimited unlocks" label, no counter
- "Exports: X / 500 used"

### Upgrade card for free users

Below the search area, a persistent (but subtle) upgrade nudge:

```
┌─────────────────────────────────────┐
│  Running low on unlocks?            │
│  Pro gives you 150/month.           │
│  [View plans →]                     │
└─────────────────────────────────────┘
```

- `bg-navy-light/50 border border-gold/20`
- Shown only to free users, only after first unlock used
- Dismissed after upgrade or after user clicks "Dismiss" (stored in DB)

### Free users: page 2 restriction

Currently free users are silently shown page 1 only with no explanation. Fix:

```
Showing 25 of 12,400+ contacts.
[Upgrade to Pro to see all results →]
```

This should appear at the bottom of the results list for free users as a clear upgrade nudge.

### Empty search state

```
[Search icon]

No contacts found for "[query]"

Try:
• Removing a filter
• Searching a broader term
• Checking for spelling variations

[Clear search]
```

### Files affected

- `apps/web/src/app/app/page.tsx`
- `apps/web/src/app/app/WelcomeBanner.tsx` — rewrite with DB-backed state
- New: `apps/web/src/components/app-shell/UnlockCounter.tsx`
- New: `apps/web/src/components/app-shell/SuggestedSearches.tsx`
- New: `apps/web/src/components/app-shell/UpgradeNudge.tsx`
- New: `apps/web/src/components/search/EmptyState.tsx`

---

## 10. Navigation Redesign

### Top navigation (desktop, `h-[60px]`)

```
[Logo]  [Search] [Opportunities] [Lists]  ·····  [Unlocks widget] [Profile ▾]
```

**Active state:** Gold bottom border (`border-b-2 border-gold`) on active link. Not background fill.

**Profile dropdown items:**
- My Profile
- Exports
- Billing & Plans
- Settings
- Admin *(if role = admin)*
- Sign out

**Upgrade CTA in nav (free users only):**
A small `bg-gold text-navy-dark` pill button next to the unlocks widget:
```
Upgrade [↑]
```
Shown when `remaining_unlocks <= 1` or plan is free.

### Bottom navigation (mobile only, `h-[60px]`)

**Tabs:**
```
[🔍 Search] [⚡ Unlock] [📋 Lists] [··· More]
```

Wait — "Unlock" as a tab doesn't quite work. Revised:

```
[Search] [Opportunities] [Lists] [Account]
```

- Active tab: gold icon + gold text label
- Inactive: gray icon + gray text

**"Account" tab** opens a bottom sheet with: Profile, Exports, Billing, Settings, Sign out.

### Nav items: show/hide rules

| Item | Show when |
|---|---|
| Search | Always |
| Opportunities | Always (but badge "Coming soon" if 0 live opportunities) |
| Lists | Always (show empty state, not 404) |
| Exports | Profile dropdown only — not primary nav |
| Billing | Profile dropdown — shown prominently if free user |
| Admin | Admin role only |

### Opportunities "coming soon" handling

Rather than showing an empty page, if `opportunities` table is empty:

```
[Coming soon badge on nav item]

On the page itself:
"Opportunities launching soon"
"Be the first to know when trials, jobs, and opportunities go live."
[Join the waitlist for opportunities]  ← stores email in a `opportunity_waitlist` column on profiles
```

This avoids a dead page while creating an interest signal.

### Breadcrumbs on inner pages

Add breadcrumb to contact detail pages and billing page:

```
← Back to search
```

Use Next.js `<Link href="/app">` not `<a>` (fix bug N5 from audit).

---

## 11. Search → First Unlock Activation Flow

### Goal

TTFU (time-to-first-unlock from onboarding completion) under 5 minutes.

### The activation path

```
Onboarding done
    ↓
Dashboard with suggested searches + free unlock counter visible
    ↓
User clicks a suggested search chip
    ↓
Contact list loads with relevant results
    ↓
User clicks a contact row → ContactPreview opens
    ↓
User sees: name, role, org visible / email+phone+LinkedIn = locked (gold lock icon)
    ↓
User clicks "Unlock contact details"
    ↓
[If not email verified] → Verification gate shown inline
[If email verified] → Confirmation prompt shown
    ↓
User confirms → API call → unlock proceeds
    ↓
Success: email, phone, LinkedIn appear with animation
"First unlock" moment: special congratulations message
    ↓
"You have X unlocks remaining. [Search more contacts]"
    ↓
[If free unlocks exhausted] → Upgrade prompt
```

### Search results layout

**Contact row design:**
```
[Org logo] Name                    Role             Country    [🔒 Unlock]
           Organisation            Category badge             [preview]
```

**Fields visible to all users (no unlock needed):**
- Full name
- Role / title
- Organisation name
- Category (Agent, Scout, Club Official, etc.)
- Country
- City
- LinkedIn available indicator (icon only, no URL)
- Phone available indicator (icon only)
- Email available indicator (icon only)

**Fields requiring unlock:**
- Email address
- Phone number
- LinkedIn URL

**Lock state design:**
```
Email:    [🔒 ••••••@••••••.com]
Phone:    [🔒 +44 ••• •••• ••••]
LinkedIn: [🔒 linkedin.com/in/•••••]
```

Use obscured placeholder text to show format. Creates more desire than a plain lock icon.

### Unlock confirmation prompt

After user clicks "Unlock contact details":

**Show a small inline confirmation within the contact panel:**
```
┌────────────────────────────────────────┐
│  Unlock [Name]?                        │
│                                        │
│  This will use 1 of your 3 unlocks.   │
│  You'll see their email, phone, and   │
│  LinkedIn directly.                    │
│                                        │
│  [Confirm unlock]    [Cancel]          │
└────────────────────────────────────────┘
```

**Why a confirmation?** Prevents accidental unlock use on mobile. Reinforces the "credit" mental model.

### Post-unlock state

**First unlock ever (special state):**
```
[Sparkle / unlock animation — subtle gold shimmer over revealed fields]

You've unlocked your first contact.

Email:    name@club.com         [Copy] 
Phone:    +44 7700 900123       [Copy]
LinkedIn: linkedin.com/in/name  [Open]

This is how Footy Contacts works — find them, unlock, reach out.
You have 2 unlocks remaining.

[Search more contacts]   [Upgrade for 150/month]
```

**Subsequent unlocks:**
```
Contact details unlocked.

Email:    name@club.com         [Copy]
Phone:    +44 7700 900123       [Copy]
LinkedIn: linkedin.com/in/name  [Open]

2 unlocks remaining.
```

### After all free unlocks used

```
┌──────────────────────────────────────────────┐
│  You've used all 3 free unlocks.             │
│                                              │
│  Upgrade to Pro to unlock 150 contacts      │
│  per month — scouts, agents, coaches,        │
│  club staff, and more.                       │
│                                              │
│  [Upgrade to Pro — £39/month]               │
│  [View all plans]                            │
│                                              │
│  Or [share Footy Contacts] to earn a        │
│  bonus unlock.                               │
└──────────────────────────────────────────────┘
```

This modal/card appears:
1. When a user attempts to unlock with 0 credits
2. As a persistent card on the dashboard for free users at 0

### Free page cap UX fix

```
── Results 1–25 of 12,400+ ──────────────────────────────────
[Contact rows]
                                                             
─── You're on the free plan ────────────────────────────────
Showing 25 results. Upgrade to Pro to see all 12,400+.
[View Pro plans →]
```

### Critical fix: server-side field protection (SEC2/U1)

**This must be implemented before any growth work.**

The contact detail page currently uses `select("*")` which returns email, phone, and LinkedIn to the server component regardless of unlock status. The display is conditional but data is in the HTML.

**Fix:**

1. Create a Postgres function:
```sql
create or replace function get_contact_for_user(p_contact_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  v_contact contacts%rowtype;
  v_is_unlocked boolean;
  v_result json;
begin
  select * into v_contact from contacts
  where id = p_contact_id and visibility_status = 'published';
  
  if not found then
    return null;
  end if;
  
  select exists(
    select 1 from contact_unlocks
    where contact_id = p_contact_id 
    and user_id = auth.uid()
  ) into v_is_unlocked;
  
  if v_is_unlocked then
    return row_to_json(v_contact);
  else
    -- Return contact without sensitive fields
    return json_build_object(
      'id', v_contact.id,
      'name', v_contact.name,
      'role', v_contact.role,
      'organisation', v_contact.organisation,
      'category', v_contact.category,
      'country', v_contact.country,
      'city', v_contact.city,
      'verified_status', v_contact.verified_status,
      'has_email', v_contact.has_email,
      'has_phone', v_contact.has_phone,
      'has_linkedin', v_contact.has_linkedin,
      'visibility_status', v_contact.visibility_status
      -- email, phone, linkedin_url intentionally excluded
    );
  end if;
end;
$$;
```

2. In `apps/web/src/app/app/contacts/[id]/page.tsx`, replace `select("*")` with a call to `rpc('get_contact_for_user', { p_contact_id: id })`.

3. Never include email, phone, or linkedin_url in the page payload unless `is_unlocked = true`.

---

## 12. Opportunities & Trials Strategy

### Current state

- Table and schema exist
- 0 rows of live content
- UI exists but links to 404 detail pages
- Mentioned in product positioning but not deliverable

### Recommendation

**Do not remove or hide opportunities from the nav.** It is a core part of the value proposition.

Instead, execute this phased strategy:

#### Phase A: Pre-launch (before public growth push)

**Action 1:** Fix the 404 (OP3 from audit). Create `/app/opportunities/[id]/page.tsx` with a proper opportunity detail and apply flow.

**Action 2:** Manually seed 15–25 real opportunities. Sources:
- Real football job boards (FA vacancies, EFL jobs, Transfermarkt openings, LinkedIn)
- Manual research: U18/U23 trial days, non-league coaching vacancies, academy recruitment roles
- Post them via the existing admin panel at `/admin/opportunities`

Types to seed:
- Trial days (3–5 entries)
- Coaching vacancies (5–8 entries)
- Recruitment/scout roles (3–5 entries)
- Media/journalism openings (2–3 entries)

**Action 3:** Present the nav item with a "NEW" badge to create interest.

#### Phase B: During launch

On the opportunities listing page, above the opportunities:

```
[⚡ NEW] Opportunities · Trials · Industry Openings

Find your next move in football. Apply directly.
```

If opportunities exist: show them.

If count drops to 0 in future: show "Check back soon — new opportunities added weekly."

**Never show a completely bare empty-state page in the nav without explanation.**

#### Phase C: Post-launch (paid posting)

After first paying subscribers, allow paid plan users to post opportunities. This creates a network-effect flywheel.

### Detail page fix (OP3)

Create `apps/web/src/app/app/opportunities/[id]/page.tsx`:
- Fetch opportunity from Supabase by ID
- Display: title, organisation, role type, location, closing date, description
- Apply button (if `opportunity.application_method === 'internal'`): shows a form
- External apply button (if `opportunity.application_method === 'external'`): links out
- Login gate for non-authenticated users

### Application flow

For internal applications, use existing `opportunity_responses` table:
- Fields: name, current club/organisation, level, country, brief message, highlight video URL (optional)
- On submit: insert to `opportunity_responses`, email the poster

---

## 13. Visual Design System

### CSS token extensions (`apps/web/src/app/globals.css`)

Add to the existing `@theme` block:

```css
@theme {
  /* === Existing (keep) === */
  --color-gold:        #F9D783;
  --color-gold-dark:   #E8C355;
  --color-navy:        #222C41;
  --color-navy-light:  #2E3A52;
  --color-navy-dark:   #161E2E;
  --color-surface:     var(--color-navy-light);
  --color-page:        var(--color-navy-dark);
  --color-border:      rgba(46, 58, 82, 1);  /* navy-light full opacity */

  /* === New semantic tokens === */
  --color-text-primary:   #FFFFFF;
  --color-text-secondary: #9CA3AF;   /* gray-400 — passes WCAG AA on navy-dark */
  --color-text-muted:     #6B7280;   /* gray-500 — body only, NOT on navy-dark */
  --color-text-on-gold:   #161E2E;   /* navy-dark — text on gold buttons */
  --color-border-subtle:  rgba(255, 255, 255, 0.06);
  --color-gold-glow:      rgba(249, 215, 131, 0.12);
  --color-gold-glow-lg:   rgba(249, 215, 131, 0.20);
  --color-error:          #F87171;   /* red-400 */
  --color-warning:        #FBBF24;   /* amber-400 */
  --color-success:        #34D399;   /* emerald-400 */

  /* === Typography scale === */
  --text-display:   clamp(2.5rem, 5vw, 4rem);   /* 40–64px */
  --text-h1:        clamp(2rem, 4vw, 3rem);       /* 32–48px */
  --text-h2:        clamp(1.5rem, 3vw, 2rem);     /* 24–32px */
  --text-h3:        1.25rem;                       /* 20px */
  --text-h4:        1.125rem;                      /* 18px */
  --text-body-lg:   1.125rem;                      /* 18px */
  --text-body:      1rem;                          /* 16px */
  --text-body-sm:   0.875rem;                      /* 14px */
  --text-caption:   0.75rem;                       /* 12px */
  --text-label:     0.6875rem;                     /* 11px */

  /* === Radius scale === */
  --radius-sm:   0.375rem;   /* 6px  — inputs, badges */
  --radius-md:   0.75rem;    /* 12px — buttons */
  --radius-lg:   1rem;       /* 16px — cards */
  --radius-xl:   1.5rem;     /* 24px — large cards, modals */
  --radius-full: 9999px;     /* pills */

  /* === Shadow tokens === */
  --shadow-card:    0 4px 24px rgba(0,0,0,0.40);
  --shadow-raised:  0 8px 40px rgba(0,0,0,0.60);
  --shadow-gold:    0 0 32px var(--color-gold-glow-lg);
  --shadow-inset:   inset 0 1px 0 rgba(255,255,255,0.05);

  /* === Gradient tokens === */
  --gradient-page:  linear-gradient(160deg, #161E2E 0%, #1A2436 100%);
  --gradient-card:  linear-gradient(160deg, #2E3A52 0%, #222C41 100%);
  --gradient-gold:  linear-gradient(90deg, #F9D783 0%, #E8C355 100%);
  --gradient-hero:  radial-gradient(ellipse 80% 60% at 50% -10%, rgba(249,215,131,0.08) 0%, transparent 70%);
  --gradient-cta:   linear-gradient(135deg, #F9D783 0%, #E8C355 100%);

  /* === Transition tokens === */
  --transition-fast:    150ms ease;
  --transition-base:    250ms ease;
  --transition-slow:    400ms ease;
  --transition-spring:  300ms cubic-bezier(0.34, 1.56, 0.64, 1);

  /* === Z-index scale === */
  --z-base:     1;
  --z-raised:   10;
  --z-nav:      30;
  --z-modal:    50;
  --z-toast:    60;
  --z-overlay:  100;

  /* === Spacing (confirm Tailwind default is the scale) === */
  /* Use Tailwind's default 4px base. No custom spacing. */
}
```

### Shared utility classes (`globals.css`)

```css
/* === Buttons === */
.btn-primary {
  @apply bg-gold text-navy-dark font-semibold rounded-xl px-6 py-3
    hover:bg-gold-dark transition-colors duration-150
    focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2 focus:ring-offset-navy-dark
    disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply bg-transparent text-white border border-navy-light font-medium rounded-xl px-6 py-3
    hover:bg-navy-light hover:border-navy transition-colors duration-150
    focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-1 focus:ring-offset-navy-dark;
}

.btn-ghost {
  @apply bg-transparent text-gray-400 font-medium rounded-xl px-4 py-2
    hover:text-white hover:bg-navy-light/50 transition-colors duration-150;
}

.btn-danger {
  @apply bg-red-900/30 text-red-400 border border-red-900 font-medium rounded-xl px-6 py-3
    hover:bg-red-900/50 transition-colors duration-150;
}

/* === Inputs === */
.input-base {
  @apply w-full bg-navy border border-navy-light text-white rounded-xl px-4 py-3
    placeholder:text-gray-500
    focus:outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold
    transition-colors duration-150;
}

.input-error {
  @apply border-red-500 focus:ring-red-500/50 focus:border-red-500;
}

/* === Cards === */
.card {
  @apply bg-navy-light border border-[rgba(255,255,255,0.06)] rounded-2xl p-6
    shadow-[0_4px_24px_rgba(0,0,0,0.40)];
}

.card-sm {
  @apply bg-navy-light border border-[rgba(255,255,255,0.06)] rounded-xl p-4;
}

.card-gold {
  @apply bg-navy-light border border-gold/20 rounded-2xl p-6
    shadow-[0_0_32px_rgba(249,215,131,0.08)];
}

/* === Badges === */
.badge {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}

.badge-gold {
  @apply badge bg-gold/15 text-gold border border-gold/20;
}

.badge-navy {
  @apply badge bg-navy text-gray-300 border border-navy-light;
}

/* === Typography === */
.heading-display {
  @apply font-bold text-white leading-tight tracking-tight;
  font-size: var(--text-display);
}

.heading-h1 { @apply font-bold text-white leading-tight; font-size: var(--text-h1); }
.heading-h2 { @apply font-semibold text-white leading-snug; font-size: var(--text-h2); }
.heading-h3 { @apply font-semibold text-white; font-size: var(--text-h3); }
.body-lg     { @apply text-gray-300 leading-relaxed; font-size: var(--text-body-lg); }
.body        { @apply text-gray-400; font-size: var(--text-body); }
.body-sm     { @apply text-gray-400; font-size: var(--text-body-sm); }
.caption     { @apply text-gray-500; font-size: var(--text-caption); }
.label       { @apply text-gray-400 font-medium uppercase tracking-wider; font-size: var(--text-label); }

/* === Locked field === */
.field-locked {
  @apply flex items-center gap-2 px-3 py-2.5 bg-navy rounded-lg
    border border-navy-light/50 text-gray-500 text-sm select-none;
}

/* === Section styles === */
.section-page { @apply py-24 px-4; }
.section-sm   { @apply py-16 px-4; }
.section-title { @apply heading-h2 text-center mb-4; }
.section-sub   { @apply body-lg text-center mb-12 max-w-xl mx-auto; }

/* === Loading skeleton === */
.skeleton {
  @apply bg-navy-light rounded animate-pulse;
}
```

### TypeScript brand tokens (`apps/web/src/lib/brand.ts`)

```typescript
/**
 * Brand tokens for use in JS/TS contexts (charts, animations, generated styles).
 * CSS variables are the authoritative source; this mirrors them for code use.
 */

export const colors = {
  gold:        '#F9D783',
  goldDark:    '#E8C355',
  navy:        '#222C41',
  navyLight:   '#2E3A52',
  navyDark:    '#161E2E',
  surface:     '#2E3A52',
  page:        '#161E2E',
  border:      'rgba(255, 255, 255, 0.06)',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  error:       '#F87171',
  warning:     '#FBBF24',
  success:     '#34D399',
} as const

export const shadows = {
  card:   '0 4px 24px rgba(0,0,0,0.40)',
  raised: '0 8px 40px rgba(0,0,0,0.60)',
  gold:   '0 0 32px rgba(249,215,131,0.20)',
} as const

export const transitions = {
  fast:   '150ms ease',
  base:   '250ms ease',
  slow:   '400ms ease',
  spring: '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const

export const zIndex = {
  base:    1,
  raised:  10,
  nav:     30,
  modal:   50,
  toast:   60,
  overlay: 100,
} as const
```

### Icon system

Use **Heroicons** (already compatible with Tailwind) throughout. No inline SVG path strings. No mixing of icon libraries.

```typescript
// Good
import { LockClosedIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

// Bad — never do this
<svg><path d="M..." /></svg>
```

Install: `pnpm add @heroicons/react --filter @footy/web`

---

## 14. Image & Asset Strategy

### Asset philosophy

The product does not need stock football photography. It needs:
1. The product itself (UI screenshots/mockups) as the primary visual
2. Abstract dark background textures for atmosphere
3. Clean iconography

### Assets to create

| Asset | Type | Usage | Notes |
|---|---|---|---|
| `logo-primary.svg` | SVG | Dark-bg navbar, email | Gold icon + white/gold wordmark |
| `logo-icon.svg` | SVG | Favicon, og-image stamp | Gold icon only |
| `favicon.ico` / `favicon.svg` | ICO + SVG | Browser tab | Gold icon on navy-dark |
| `apple-touch-icon.png` | PNG 180×180 | iOS homescreen | Gold icon on navy-dark |
| `og-image.png` | PNG 1200×630 | Social previews | Dark bg, logo, headline |
| `hero-preview.tsx` | React component | Homepage hero right panel | Pure code: fake contact card UI |
| `bg-texture.svg` | SVG | Page background overlay | Subtle dot grid, opacity 4% |

### What NOT to use

- Stock football photography (players, pitches, balls, crowds)
- Generic dark blurred stadium images
- Illustrations of people
- AI-generated football art
- Animated GIFs
- Heavy background videos

### Hero visual treatment

The hero's right-side product preview should be built as a React component, not an image. This:
- Loads instantly
- Stays on-brand always
- Can animate subtly without video/GIF
- Is responsive by default

```tsx
// apps/marketing/src/components/HeroPreview.tsx
// A decorative card showing 3 "locked" contact rows with gold unlock buttons
// Purely decorative, not interactive (aria-hidden)
```

### Background texture

A subtle CSS dot-grid pattern for hero sections:

```css
.hero-texture {
  background-image: radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px);
  background-size: 32px 32px;
}
```

No image file needed. Pure CSS. Zero bytes. Works at any resolution.

### Open Graph image

Create `public/og-image.png` (1200×630):
- Background: `#161E2E` (navy-dark)
- Logo: gold icon + white "Footy" + gold "Contacts" wordmark, centred top
- Headline: "Search the Football Network" in white, large
- Sub: "12,400+ contacts · 114 countries · scouts, agents, coaches" in gray
- Bottom strip: gold gradient line

This can be generated once with any design tool (Figma, Canva, etc.) or built as a dynamic OG image using `@vercel/og` for page-specific previews later.

### Favicon implementation

In `apps/web/src/app/layout.tsx` and `apps/marketing/src/app/layout.tsx`:

```tsx
export const metadata: Metadata = {
  icons: {
    icon: '/favicon.svg',
    apple: '/apple-touch-icon.png',
  },
}
```

### Performance rules

- All `<img>` tags → replaced with Next.js `<Image>` with explicit `width`, `height`
- Hero `<Image>` assets: `priority={true}`
- Below-fold images: default lazy loading
- Logo in nav: `<Image priority width={140} height={32} src="/logo-primary.svg" alt="Footy Contacts" />`
- No base64 encoded images in CSS/JS
- Max image file size: 150KB before Next.js optimisation

---

## 15. Copywriting System

### Words to use

| Category | Words |
|---|---|
| Access | access, unlock, reveal, discover, find, reach, search, connect |
| Opportunity | opportunity, pathway, opening, move, step, door, network |
| Product | contact, connection, professional, football industry, decision-maker |
| Trust | direct, verified (only when true), published, accurate, real |
| Speed | faster, instantly, in seconds, without guessing, directly |
| Value | included, free, allowance, investment, worth it |

### Words to avoid

| Category | Avoid | Reason |
|---|---|---|
| Overclaims | "guaranteed", "proven", "100% verified" | Not always accurate |
| Scammy | "hack your way in", "secret database", "insider list" | Cheap feel |
| Career promises | "get signed", "make it pro", "land your dream job" | Cannot promise outcomes |
| Generic SaaS | "solution", "platform features", "leverage", "synergy" | Off-brand |
| Legal risk | "all verified", "guaranteed delivery", "success rate" | Misleading |

### CTA language

| Context | CTA |
|---|---|
| Primary homepage CTA | `Get access — it's free` |
| Secondary / see more | `See how it works ↓` |
| Sign up button | `Create account →` |
| Sign in button | `Sign in →` |
| Unlock button | `Unlock contact details` |
| Upgrade from wall | `Upgrade to Pro — £39/month` |
| View plans | `View plans →` |
| Search CTA | `Search contacts →` |
| Suggested search | `[Role · Region]` chip |

### Trust language

- "No credit card required" — standard, effective
- "3 unlocks included free" — specific, not vague "try for free"
- "Cancel anytime" — reduces risk perception
- "Used by football professionals across [X] countries" — accurate once usage grows
- "Direct contact details" — factual
- "Published and searchable" — describes the actual state of contacts

### Upgrade language

**Framing:** Upgrade = access more, not "pay to unlock what was blocked"

| State | Copy |
|---|---|
| First upgrade prompt | `You've used your 3 free unlocks. Upgrade to keep going.` |
| Upgrade modal headline | `Get more access` |
| Plan benefit | `150 unlocks per month — scouts, agents, clubs, coaches` |
| Urgency | Real: "New contacts added regularly" / Never: fake countdown timers |
| Post-upgrade | `Pro access active. 150 unlocks/month. [Start searching →]` |

### Unlock language

| State | Copy |
|---|---|
| Locked field | `Unlock to reveal` |
| Unlock button | `Unlock contact details` |
| Sub-copy | `Uses 1 unlock · X remaining` |
| Confirming | `Unlock [Name]? Uses 1 of your X unlocks.` |
| Success | `Contact unlocked. Email, phone, and LinkedIn now visible.` |
| No credits | `You've used your free unlocks. Upgrade for 150/month.` |

### Error message tone

All errors should be:
- Factual — what happened
- Actionable — what to do
- Calm — not alarming
- Never technical — no raw error codes

| State | Copy |
|---|---|
| Login failed | `That email or password is incorrect.` |
| Network error | `Something went wrong. Check your connection and try again.` |
| Session expired | `Your session has ended. Sign in again to continue.` |
| Link expired | `That link has expired. Request a new one.` |
| Rate limited | `Too many requests. Wait a moment before trying again.` |

### Empty state tone

- Helpful, not apologetic
- Suggests next action
- Never "No results found" alone — always pair with a suggestion

---

## 16. Security & Abuse Prevention

### P0 — Critical fixes (block before launch)

#### SEC-FIX-1: Contact fields server-side protection

**Problem:** `select("*")` on the contact detail page returns email, phone, LinkedIn to the server component regardless of unlock status. Data is in the HTML source.

**Fix:**
1. Create `get_contact_for_user(p_contact_id uuid)` Postgres function (see Section 11).
2. Replace `select("*")` calls on the contact detail page with this RPC.
3. RLS policy must be verified: the RPC uses `security definer` and checks `auth.uid()`.
4. The API route for unlock must be the only place that can trigger the field reveal — never the page load itself.

**Also fix:** The search list query (`ContactsList`) already correctly selects only non-sensitive columns. This is fine. Only the contact detail page has the issue.

#### SEC-FIX-2: Email verification before unlock

**Problem:** No email verification check before unlock. Disposable email abuse.

**Fix:** As described in Section 7. Both client-side gate and server-side check in the unlock API route.

#### SEC-FIX-3: Auth callback `next` param ignored

**Problem (A2 from audit):** Password reset callback ignores the `next` query param, sending users to `/app` instead of the password update page.

**Fix:** In `/auth/callback/route.ts`:
```typescript
const next = searchParams.get('next') ?? '/app'
// After successful code exchange:
return NextResponse.redirect(new URL(next, requestUrl.origin))
```

Only allow safe `next` values (must start with `/` to prevent open redirects):
```typescript
const safeNext = next.startsWith('/') ? next : '/app'
```

#### SEC-FIX-4: Error params displayed on login page

**Problem (A5 from audit):** `?error=auth_callback_failed` is not read or displayed.

**Fix:** Login page reads `searchParams.error` and renders the appropriate message (as per Section 6 error table).

### Rate limiting

| Endpoint | Current | Recommendation |
|---|---|---|
| `POST /api/contacts/[id]/unlock` | 20/user/min, 200/user/day (Redis) | Keep. Add email verification check first. |
| `POST /api/contacts/export` | 1/user/hour (Redis) | Keep. |
| `GET /app/app` (search page) | None | Add: 100 searches/user/minute server-side (Upstash) |
| `POST /api/auth/signup` | Supabase built-in | Add Turnstile on signup form |
| `POST /api/auth/login` | Supabase built-in | Monitor with Supabase auth logs |

#### Redis fail-open risk (SEC4/SEC5 from audit)

Currently if Upstash Redis is unavailable, rate limits are bypassed (fail-open).

**Fix:** Add a circuit-breaker flag:
```typescript
// lib/rate-limit.ts
const FAIL_CLOSED = process.env.RATE_LIMIT_FAIL_CLOSED === 'true'

// If Redis throws and FAIL_CLOSED is true, return { success: false }
// If Redis throws and FAIL_CLOSED is false, return { success: true }
```

For unlock endpoints, set `RATE_LIMIT_FAIL_CLOSED=true` in Vercel env.  
For search, set `RATE_LIMIT_FAIL_CLOSED=false` (search is low-risk).

### Content Security Policy (SEC11 from audit)

No CSP headers currently. Add in `next.config.ts`:

```typescript
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://challenges.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com",
      "frame-src https://js.stripe.com https://challenges.cloudflare.com",
    ].join('; ')
  },
]

module.exports = {
  async headers() {
    return [{
      source: '/(.*)',
      headers: securityHeaders,
    }]
  }
}
```

Note: `'unsafe-eval'` and `'unsafe-inline'` are required by Next.js in development. In production, tighten using nonce-based CSP after initial setup.

### Cloudflare Turnstile (bot protection on signup)

Add to the sign-up form to prevent automated account creation at scale.

```bash
pnpm add @marsidev/react-turnstile --filter @footy/web
```

Add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` to Vercel env.  
Validate the token in the sign-up API route or Supabase auth hook.

This is a significant abuse vector reduction at minimal UX cost (invisible challenge mode).

### RLS policy audit

Verify these policies exist and are correct on the `contacts` table:

```sql
-- Users can read published contacts (no sensitive fields)
create policy "Published contacts readable by authenticated users"
on contacts for select
to authenticated
using (visibility_status = 'published');

-- Sensitive fields only via get_contact_for_user RPC
-- The RPC uses security definer and handles unlock checks
```

Verify `contact_unlocks` RLS:
```sql
-- Users can only read their own unlocks
create policy "Users read own unlocks"
on contact_unlocks for select
to authenticated
using (user_id = auth.uid());

-- Unlock insert handled by server-side RPC only, not direct insert
```

### Middleware profile select

**SEC7 from audit:** Middleware currently `select("*")` on profiles. Fix to:

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('role, is_suspended, onboarding_completed')
  .eq('id', user.id)
  .single()
```

### Admin client usage

`createAdminClient()` (service-role key) must only be used in:
- Server Actions
- API routes
- Server components that are guaranteed server-only

Add a lint rule or comment convention: `// admin-client: intentional service-role usage` wherever it is used, to make auditing easier.

### Security checklist (pre-launch)

- [ ] `get_contact_for_user` RPC created and deployed
- [ ] Contact detail page uses RPC not `select("*")`
- [ ] Email verification check in unlock API route
- [ ] Email verification check client-side before unlock API call
- [ ] Auth callback handles `next` param correctly
- [ ] Login page reads and displays `?error` params
- [ ] Rate limiter fail-closed for unlock endpoint
- [ ] CSP headers added to `next.config.ts`
- [ ] Turnstile on sign-up form
- [ ] Middleware profile select is narrow (role, is_suspended, onboarding_completed only)
- [ ] Google OAuth removed from sign-up and sign-in pages
- [ ] ReactQueryDevtools removed from production bundle
- [ ] `email_confirmed_at` check in unlock API confirmed working end-to-end

---

## 17. Frontend Architecture

### Recommended component structure

```
apps/web/src/
├── app/
│   ├── (marketing)/                 # Public/unauthenticated pages
│   │   ├── page.tsx                 # Landing page (or redirect to marketing site)
│   │   ├── pricing/page.tsx
│   │   └── layout.tsx
│   ├── (auth)/                      # Auth pages
│   │   ├── layout.tsx               # AuthSplitLayout wrapper
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── auth/
│   │       ├── callback/route.ts
│   │       └── update-password/page.tsx
│   ├── onboarding/                  # Onboarding (standalone layout)
│   │   └── page.tsx
│   └── app/                         # Authenticated app (current structure, keep)
│       ├── layout.tsx
│       ├── page.tsx
│       ├── contacts/[id]/page.tsx
│       ├── opportunities/
│       │   ├── page.tsx
│       │   └── [id]/page.tsx        # NEW
│       ├── lists/
│       ├── exports/
│       ├── billing/
│       ├── profile/
│       └── settings/
│
├── components/
│   ├── ui/                          # Primitive components (reusable everywhere)
│   │   ├── Button.tsx               # btn-primary, btn-secondary, btn-ghost, btn-danger
│   │   ├── Input.tsx                # input-base + error state
│   │   ├── Card.tsx                 # card, card-sm, card-gold variants
│   │   ├── Badge.tsx                # badge, badge-gold, badge-navy + custom colour
│   │   ├── Modal.tsx                # accessible modal with backdrop
│   │   ├── Sheet.tsx                # bottom sheet for mobile
│   │   ├── Spinner.tsx              # loading spinner
│   │   ├── Skeleton.tsx             # skeleton loader
│   │   ├── Toast.tsx                # success/error/info toast
│   │   ├── Avatar.tsx               # org/user avatar with fallback initials
│   │   ├── Dropdown.tsx             # accessible dropdown menu
│   │   ├── PasswordField.tsx        # password input with show/hide
│   │   ├── PasswordStrength.tsx     # password requirement indicators
│   │   └── EmptyState.tsx           # reusable empty state with icon/title/body/CTA
│   │
│   ├── auth/                        # Auth-specific components
│   │   ├── AuthSplitLayout.tsx      # Two-column auth page shell
│   │   ├── AuthCard.tsx             # Single-column auth card for mobile
│   │   └── AuthLogo.tsx             # Logo treatment for auth pages
│   │
│   ├── onboarding/                  # Onboarding step components
│   │   ├── OnboardingShell.tsx      # Progress bar, step container, navigation
│   │   ├── StepWho.tsx              # Step 1: user type
│   │   ├── StepWhat.tsx             # Step 2: looking for
│   │   ├── StepWhere.tsx            # Step 3: region
│   │   └── OnboardingDone.tsx       # Completion screen with suggestions
│   │
│   ├── app-shell/                   # Logged-in app chrome
│   │   ├── TopNav.tsx               # Existing, refactored
│   │   ├── BottomNav.tsx            # Existing, refactored
│   │   ├── UnlockCounter.tsx        # NEW: remaining unlocks display
│   │   ├── SuggestedSearches.tsx    # NEW: onboarding-derived search chips
│   │   ├── UpgradeNudge.tsx         # NEW: free user upgrade prompt
│   │   ├── WelcomeBanner.tsx        # Existing, DB-backed rewrite
│   │   └── VerificationBanner.tsx   # NEW: unverified email nudge
│   │
│   ├── search/                      # Search components
│   │   ├── SearchBar.tsx            # Existing
│   │   ├── SearchFilters.tsx        # Existing, refactored
│   │   ├── ContactsList.tsx         # Existing
│   │   ├── ContactRow.tsx           # Existing
│   │   ├── ContactPreview.tsx       # Existing
│   │   └── EmptyState.tsx           # Search-specific empty state
│   │
│   ├── unlock/                      # Unlock flow components
│   │   ├── UnlockButton.tsx         # Existing, refactored
│   │   ├── UnlockGate.tsx           # NEW: verification gate shown before unlock
│   │   ├── UnlockConfirm.tsx        # NEW: confirmation prompt
│   │   ├── UnlockSuccess.tsx        # NEW: success state with copy buttons
│   │   ├── UnlockWall.tsx           # Rewrite of UnlockWallModal + UpgradeModal
│   │   └── LockedField.tsx          # NEW: locked field display (obscured placeholder)
│   │
│   ├── pricing/                     # Pricing and upgrade components
│   │   ├── UpgradeModal.tsx         # Existing, refactored
│   │   ├── PricingCard.tsx          # NEW: individual plan card
│   │   └── PlanBadge.tsx            # NEW: current plan badge in nav/billing
│   │
│   └── marketing/                   # Marketing site components (in apps/marketing)
│       ├── Navbar.tsx
│       ├── Footer.tsx
│       ├── HeroSection.tsx
│       ├── DataProofStrip.tsx
│       ├── SearchExamples.tsx
│       ├── FeatureGrid.tsx
│       ├── PersonaGrid.tsx
│       ├── EmotionalSection.tsx
│       ├── HowItWorks.tsx
│       ├── PricingTeaser.tsx
│       └── FinalCTA.tsx
│
├── lib/
│   ├── brand.ts                     # NEW: TS brand tokens
│   ├── analytics.ts                 # NEW: event tracking wrapper
│   ├── validations.ts               # NEW: Zod schemas for forms
│   ├── onboarding/
│   │   └── suggestions.ts           # NEW: suggested search generation
│   ├── supabase/
│   │   ├── client.ts                # Existing
│   │   ├── server.ts                # Existing
│   │   └── admin.ts                 # Existing
│   ├── email/                       # Existing
│   ├── rate-limit.ts                # Existing, updated fail-closed behaviour
│   ├── secrets.ts                   # Existing
│   ├── stripe.ts                    # Existing
│   └── utils.ts                     # Existing
│
└── hooks/                           # Custom React hooks (co-located in web app)
    ├── useUnlocks.ts                # Wraps UnlocksProvider logic
    ├── useVerification.ts           # Checks email_confirmed_at on user session
    └── useProfile.ts                # Thin wrapper around packages/hooks/useProfile
```

### Zod validation schemas (`lib/validations.ts`)

```typescript
import { z } from 'zod'

export const signUpSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[0-9!@#$%^&*]/, 'Password must contain a number or symbol.'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match.",
  path: ['confirmPassword'],
})

export const signInSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter your password.'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
})
```

### Analytics wrapper (`lib/analytics.ts`)

```typescript
type EventProperties = Record<string, string | number | boolean | null>

export function track(event: string, properties?: EventProperties): void {
  if (typeof window === 'undefined') return
  
  // Replace with PostHog/Mixpanel/GA4 call when analytics tool is chosen
  // For now, log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[analytics]', event, properties)
  }
  
  // PostHog example:
  // window.posthog?.capture(event, properties)
  
  // GA4 example:
  // window.gtag?.('event', event, properties)
}

// Typed event helpers
export const Analytics = {
  homepageViewed: () => track('homepage_viewed'),
  heroCTAClicked: () => track('hero_cta_clicked'),
  signupStarted: () => track('signup_started'),
  signupCompleted: (method: 'email') => track('signup_completed', { method }),
  emailVerificationSent: () => track('email_verification_sent'),
  emailVerified: () => track('email_verified'),
  onboardingStarted: () => track('onboarding_started'),
  onboardingStepCompleted: (step: number) => track('onboarding_step_completed', { step }),
  onboardingCompleted: (userType: string) => track('onboarding_completed', { user_type: userType }),
  dashboardViewed: () => track('dashboard_viewed'),
  suggestedSearchClicked: (query: string) => track('suggested_search_clicked', { query }),
  searchPerformed: (query: string, filters: EventProperties) => track('search_performed', { query, ...filters }),
  contactViewed: (contactId: string) => track('contact_viewed', { contact_id: contactId }),
  unlockAttempted: (contactId: string) => track('unlock_attempted', { contact_id: contactId }),
  verificationRequiredBeforeUnlock: () => track('verification_required_before_unlock'),
  contactUnlocked: (contactId: string, unlocksRemaining: number) => 
    track('contact_unlocked', { contact_id: contactId, unlocks_remaining: unlocksRemaining }),
  freeUnlocksExhausted: () => track('free_unlocks_exhausted'),
  upgradePromptViewed: (location: string) => track('upgrade_prompt_viewed', { location }),
  upgradeCTAClicked: (plan: string, location: string) => track('upgrade_cta_clicked', { plan, location }),
  checkoutStarted: (plan: string) => track('checkout_started', { plan }),
  exportAttempted: () => track('export_attempted'),
  opportunityViewed: (opportunityId: string) => track('opportunity_viewed', { opportunity_id: opportunityId }),
} as const
```

### Remove ReactQueryDevtools from production

In `apps/web/src/app/providers.tsx`:

```tsx
import dynamic from 'next/dynamic'

const ReactQueryDevtools = dynamic(
  () => import('@tanstack/react-query-devtools').then(m => ({ default: m.ReactQueryDevtools })),
  { ssr: false }
)

// In JSX:
{process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
```

---

## 18. Analytics & Activation Tracking

### Analytics tool recommendation

**Recommended: PostHog** (self-hostable, generous free tier, session replay, funnels, feature flags).

Alternative: Mixpanel or GA4.

**Install:**
```bash
pnpm add posthog-js --filter @footy/web
```

Set up in `providers.tsx`:
```tsx
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  api_host: 'https://app.posthog.com',
  capture_pageview: false,  // manual page views for Next.js App Router
  capture_pageleave: true,
})
```

### Event definitions

| Event name | Trigger location | Key properties |
|---|---|---|
| `homepage_viewed` | `apps/marketing` page load | `source` |
| `hero_cta_clicked` | Homepage hero button | `cta_text` |
| `signup_started` | Signup page load | — |
| `signup_completed` | After `signUp()` success | `method: 'email'` |
| `email_verification_sent` | After signup success | — |
| `email_verified` | After `/auth/callback` code exchange | — |
| `onboarding_started` | Onboarding step 1 render | — |
| `onboarding_step_completed` | Each step's Next click | `step: 1|2|3`, `user_type` (on step 1) |
| `onboarding_skipped_step` | Skip link clicked | `step` |
| `onboarding_completed` | After profile upsert | `user_type`, `goals`, `region` |
| `dashboard_viewed` | `/app` page load | `is_first_visit` |
| `suggested_search_clicked` | Suggestion chip | `query`, `source: 'dashboard'` |
| `search_performed` | Search navigation | `query`, `has_filters`, `page` |
| `filter_applied` | Filter Apply click | `filter_types`, `count` |
| `contact_viewed` | Contact detail page load | `contact_id`, `is_unlocked` |
| `unlock_attempted` | Unlock button click (before API) | `contact_id`, `unlocks_remaining` |
| `verification_required_before_unlock` | Email gate shown | `contact_id` |
| `contact_unlocked` | Unlock API 200 response | `contact_id`, `unlocks_remaining_after` |
| `free_unlocks_exhausted` | Unlock wall shown at 0 credits | — |
| `upgrade_prompt_viewed` | Upgrade modal/card shown | `location`, `plan_shown` |
| `upgrade_cta_clicked` | Plan selection button | `plan`, `billing_period`, `location` |
| `checkout_started` | After Stripe checkout URL received | `plan` |
| `subscription_created` | Stripe webhook `checkout.session.completed` | `plan`, `billing_period`, `amount` |
| `export_attempted` | Export POST | `count` |
| `opportunity_viewed` | Opportunity detail page | `opportunity_id`, `opportunity_type` |

### TTFU definition and measurement

**TTFU** = Time from `onboarding_completed_at` to `first_contact_unlocked_at`

**Data availability:**
- `onboarding_completed_at`: add column to `profiles` table if not present. Set on successful onboarding profile upsert.
- `first_contact_unlocked_at`: derivable from `contact_unlocks` table: `min(created_at) where user_id = X`

**Reporting query:**
```sql
select
  p.id,
  p.onboarding_completed_at,
  min(cu.created_at) as first_unlock_at,
  extract(epoch from (min(cu.created_at) - p.onboarding_completed_at)) / 60 as ttfu_minutes
from profiles p
join contact_unlocks cu on cu.user_id = p.id
where p.onboarding_completed_at is not null
group by p.id, p.onboarding_completed_at
order by ttfu_minutes
```

**Target:** Median TTFU < 5 minutes for activated users.

**PostHog funnel to build:**

1. `onboarding_completed`
2. `dashboard_viewed`
3. `search_performed`
4. `contact_viewed`
5. `unlock_attempted`
6. `contact_unlocked`

Measure: % of users reaching each step, drop-off points, median time between steps.

### Benchmark targets

| Metric | Current | Target (Phase 1 live) | Target (Month 3) |
|---|---|---|---|
| Homepage → Signup | ~5% estimate | 8% | 12% |
| Signup → Onboarding start | ~80% | 90% | 90% |
| Onboarding start → Completion | 0.2% | 60% | 75% |
| Onboarding completion → First search | ~0% | 70% | 80% |
| First search → First unlock | ~0% | 40% | 60% |
| First unlock → Upgrade (30 days) | 0% | 5% | 15% |
| Median TTFU | N/A | < 10 min | < 5 min |

---

## 19. Implementation Roadmap

### Phase 0 — Security and foundations (Week 1, pre-launch)

**These must be done before any growth work. Non-negotiable.**

| Task | File(s) affected | Acceptance criteria |
|---|---|---|
| Create `get_contact_for_user` Postgres RPC | New migration file | RPC returns contact without sensitive fields if not unlocked |
| Replace `select("*")` on contact detail page | `app/app/contacts/[id]/page.tsx` | Page source never contains email/phone/linkedin for locked contacts |
| Add `email_confirmed_at` check to unlock API | `api/contacts/[id]/unlock/route.ts` | 403 returned if user not verified |
| Fix auth callback `next` param handling | `app/auth/callback/route.ts` | Password reset flow redirects correctly to update-password page |
| Display `?error` params on login page | `app/login/page.tsx` | Expired link shows friendly message, not blank page |
| Narrow middleware profile select | `middleware.ts` | Selects `role, is_suspended, onboarding_completed` only |
| Remove Google OAuth from sign-up and sign-in | `app/signup/page.tsx`, `app/login/page.tsx` | No Google button rendered |
| Fix emoji encoding in onboarding goals | `app/onboarding/page.tsx` | Onboarding options render correctly |
| Remove ReactQueryDevtools from production | `app/providers.tsx` | DevTools not in production bundle |
| Create `globals.css` token additions | `app/globals.css` | Full token set available |
| Create `lib/brand.ts` | New file | TS tokens exported |

**Duration:** 3–5 days  
**Risk:** RPC creation requires Supabase migration deploy. Test on staging branch first.

---

### Phase 1 — Public website and design system (Week 1–2)

| Task | File(s) affected | Acceptance criteria |
|---|---|---|
| Create `components/ui/` primitive components | New files | Button, Input, Card, Badge, Modal, Spinner, Skeleton, EmptyState all created and consistent |
| Create `components/auth/AuthSplitLayout.tsx` | New file | Reusable two-column auth shell |
| Rewrite marketing homepage (`apps/marketing`) | `apps/marketing/src/app/page.tsx` | All 10 sections present, copy accurate, no overclaims |
| Add navbar to marketing site | New `components/marketing/Navbar.tsx` | Logo + links + CTA + mobile menu |
| Add footer to marketing site | New `components/marketing/Footer.tsx` | All links present, legal links included |
| Create `/public/og-image.png` | Asset file | 1200×630, on-brand, displays on social share |
| Add favicon/apple-touch-icon | `app/layout.tsx`, `/public/` | Correct icon shown in browser tabs |
| Add security headers to `next.config.ts` | `next.config.ts` (web + marketing) | CSP, X-Frame-Options, etc. present in responses |
| SEO metadata for homepage | `apps/marketing/src/app/layout.tsx` | Title, description, OG tags all correct |
| Fix marketing CSS to use Tailwind tokens | `apps/marketing/src/app/globals.css` | No hardcoded hex values in components |

**Duration:** 1–2 weeks  
**Risk:** Marketing site is a separate Next.js app. Changes to `globals.css` must be made in both apps until a shared package is set up.

---

### Phase 2 — Auth pages (Week 2–3)

| Task | File(s) affected | Acceptance criteria |
|---|---|---|
| Rewrite sign-up page | `app/signup/page.tsx` | Email+password only, validation, post-signup state with resend, no Google OAuth |
| Add `PasswordField` + `PasswordStrength` components | New UI components | Requirements shown inline, validated before submit |
| Add Zod form validation | `lib/validations.ts` | Schemas for signup, signin, forgot-password |
| Rewrite sign-in page | `app/login/page.tsx` | Welcome back messaging, error params displayed, no Google OAuth |
| Rewrite forgot-password page | `app/forgot-password/page.tsx` | Resend link, "back to sign in" present |
| Add `VerificationBanner` component | New component | Shown on dashboard for unverified users |
| Add verification gate in unlock flow | `components/unlock/UnlockGate.tsx` | Gate shown client-side before API call if not verified |
| Test full reset flow end-to-end | `app/auth/callback/route.ts` | Reset → callback → update-password → success |

**Duration:** 1 week  
**Risk:** Supabase auth flow changes must be tested across email clients. Test resend flow carefully.

---

### Phase 3 — Onboarding (Week 3–4)

| Task | File(s) affected | Acceptance criteria |
|---|---|---|
| Extract onboarding into step components | New `components/onboarding/` | Each step is a separate file, <150 lines |
| Rewrite `OnboardingShell` with new progress UI | New component | 3 steps + done screen, progress bar, back navigation |
| Implement `StepWho` (user type) | New component | 8 options, single select, required |
| Implement `StepWhat` (looking for) | New component | 8 options, multi-select, skippable |
| Implement `StepWhere` (region) | New component | 8 region options, country text input, skippable |
| Implement `OnboardingDone` with suggestions | New component | 3–4 suggested search chips, "Go to search" CTA |
| Create `lib/onboarding/suggestions.ts` | New file | Generates correct suggestions from profile answers |
| Add `onboarding_completed_at` to profiles upsert | `app/onboarding/page.tsx` | Timestamp stored on completion |
| Test redirect: onboarding → dashboard with suggestions active | Integration test | Chips appear on dashboard based on answers |

**Duration:** 1 week  
**Dependencies:** Shared UI components from Phase 1 must exist (Button, Card).

---

### Phase 4 — Logged-in activation (Week 4–5)

| Task | File(s) affected | Acceptance criteria |
|---|---|---|
| Rewrite `WelcomeBanner` with DB-backed state | `components/app-shell/WelcomeBanner.tsx` | Uses `profiles.dashboard_welcome_dismissed`, not localStorage |
| Create `SuggestedSearches` component | New component | Chips from onboarding answers appear on first visit |
| Create `UnlockCounter` component | New component | Shows remaining unlocks, correct state for free/Pro/Agency |
| Create `UpgradeNudge` component | New component | Shown to free users after first unlock used |
| Add free page cap explanation to search | `app/app/page.tsx` | "Showing 25 of 12,400+" with upgrade link |
| Redesign unlock flow: LockedField + confirm + success | `components/unlock/` | Obscured placeholder, confirm modal, success with copy buttons |
| First-unlock special success state | `components/unlock/UnlockSuccess.tsx` | "First unlock" copy shown on very first unlock |
| Create `EmptyState` component for search | `components/search/EmptyState.tsx` | Icon + message + suggestions shown on 0 results |
| Fix back navigation on contact detail page | `app/app/contacts/[id]/page.tsx` | Uses `<Link>` not `<a>` |
| Fix opportunities 404 | `app/app/opportunities/[id]/page.tsx` | Detail page exists and renders |
| Seed 15+ opportunities manually | Admin panel | At least 15 live opportunities visible |
| Fix opportunities nav item or add "coming soon" | `components/app-shell/TopNav.tsx` | Never links to dead page |
| Redesign top nav: active state, upgrade CTA | `TopNav.tsx` | Gold border-bottom active state, upgrade pill for free users |
| Redesign bottom nav: tabs correct | `BottomNav.tsx` | Search, Opportunities, Lists, Account |

**Duration:** 1–2 weeks  
**Dependencies:** Auth flow from Phase 2, component library from Phase 1.

---

### Phase 5 — Security hardening (Week 5–6, or parallel with Phase 4)

Note: Phase 0 covers the critical security fixes. Phase 5 covers the remaining improvements.

| Task | File(s) affected | Acceptance criteria |
|---|---|---|
| Add Turnstile to sign-up form | `signup/page.tsx` + API route | Automated signup blocked |
| Rate limit fail-closed for unlock endpoint | `lib/rate-limit.ts` | Redis outage = unlock rejected, not allowed |
| RLS policy audit for contacts table | Supabase dashboard + migrations | No direct sensitive field access without unlock |
| Audit all `createAdminClient()` usages | All API routes | Every usage is intentional and documented |
| Add `RATE_LIMIT_FAIL_CLOSED` env var | Vercel + `.env.local` | Configurable per endpoint |

**Duration:** 3–5 days (parallel with Phase 4)

---

### Phase 6 — Analytics and optimisation (Week 6–8)

| Task | File(s) affected | Acceptance criteria |
|---|---|---|
| Install and configure PostHog | `providers.tsx`, Vercel env | Events flowing to PostHog dashboard |
| Instrument homepage events | `apps/marketing` | `homepage_viewed`, `hero_cta_clicked` |
| Instrument auth events | Sign up/in pages | `signup_started`, `signup_completed`, `email_verified` |
| Instrument onboarding events | Onboarding components | All step events, completion event |
| Instrument dashboard events | Dashboard + search | Search, contact view, unlock events |
| Instrument upgrade events | Upgrade modal, billing | All upgrade/checkout events |
| Build TTFU measurement query | Supabase SQL | Query documented, baseline measured |
| Set up PostHog funnel | PostHog dashboard | 6-step funnel visible |
| A/B test: homepage headline | PostHog feature flags | Two variants measurable |

**Duration:** 1 week  
**Dependencies:** Phase 1–4 complete so events have pages to fire from.

---

## 20. Priority Order

```
P0 (Before anything else):
  1. Fix SEC2/U1: contact fields server-side protection
  2. Fix A2: auth callback next param
  3. Fix OP3: opportunities 404
  4. Fix O3: emoji encoding corruption
  5. Remove Google OAuth (spec requirement)

P1 (Phase 1 foundations — enable everything else):
  6. Create brand token CSS additions
  7. Create /components/ui/ primitive components
  8. Create AuthSplitLayout
  9. Rewrite sign-up page
  10. Rewrite sign-in page

P2 (Activation path):
  11. Rewrite onboarding (extract + new flow)
  12. Email verification gate before unlock
  13. Add suggested searches on dashboard
  14. Rewrite unlock flow (confirm + success + locked fields)
  15. Fix WelcomeBanner (DB-backed)

P3 (Public growth surface):
  16. Rewrite marketing homepage
  17. Add data proof strip
  18. Add how it works, who it's for sections
  19. Add footer to marketing site
  20. Add OG image + favicon

P4 (Retention and upgrade):
  21. Upgrade nudge after first unlock
  22. Free page cap explanation
  23. Opportunities seeding + detail page
  24. UnlockCounter component

P5 (Security + measurement):
  25. Security headers (CSP)
  26. Turnstile on signup
  27. Rate limit fail-closed for unlock
  28. PostHog analytics
  29. TTFU measurement
```

---

## 21. Acceptance Criteria

### Homepage

- [ ] Visitor can state what the product does within 5 seconds of landing
- [ ] No false claims: "verified", "thousands of professionals" removed
- [ ] Data proof strip uses accurate numbers from current DB
- [ ] Primary CTA above fold on all screen sizes
- [ ] Footer with legal links present
- [ ] OG image renders correctly on Twitter/LinkedIn preview

### Sign up

- [ ] Email + password only (no Google OAuth)
- [ ] Password strength requirements shown and validated
- [ ] Post-signup screen has resend email button
- [ ] "3 free unlocks included" microcopy visible
- [ ] Error messages are human, not raw Supabase strings
- [ ] Mobile layout correct on 375px viewport

### Email verification

- [ ] Unverified users see persistent banner on dashboard
- [ ] Clicking "Unlock" while unverified shows gate (not API call)
- [ ] Unlock API returns 403 for unverified users
- [ ] Resend verification has 60s cooldown
- [ ] Expired link shows correct error on login page

### Onboarding

- [ ] 3 steps + done screen (no 700-line single file)
- [ ] Each step component is under 150 lines
- [ ] Onboarding completion stores `onboarding_completed_at` timestamp
- [ ] Done screen shows 3–4 search suggestions based on answers
- [ ] Suggestions are relevant to user type + goals + region
- [ ] Clicking a suggestion navigates to correct search
- [ ] No emoji encoding corruption in any label

### Dashboard

- [ ] First-time user sees welcome card with suggestions (not blank search)
- [ ] Welcome card dismissed state stored in DB not localStorage
- [ ] Free user sees unlock counter with remaining credits
- [ ] Free user sees upgrade nudge after first unlock used
- [ ] Page 2 restriction has visible explanation + upgrade CTA

### Unlock flow

- [ ] Locked fields show obscured placeholder (not blank / just lock icon)
- [ ] Unlock button shows confirmation step before deducting credit
- [ ] First-ever unlock shows special congratulations copy
- [ ] Post-unlock shows copy buttons for email/phone/LinkedIn
- [ ] Contact detail page source never contains gated fields for locked contacts
- [ ] Unlock API enforces `email_confirmed_at` check

### Opportunities

- [ ] `/app/opportunities/[id]` page exists and renders
- [ ] At least 15 live opportunities seeded
- [ ] Empty state has explanation, not bare page

### Security

- [ ] All items in Section 16 security checklist completed
- [ ] CSP headers verified in production response
- [ ] Middleware profile select is narrow (3 fields only)

### Component architecture

- [ ] `/components/ui/` has Button, Input, Card, Badge, Modal, Spinner, Skeleton, EmptyState
- [ ] `globals.css` has full token set (colours, typography scale, radius, shadow, gradient, transition, z-index)
- [ ] `lib/brand.ts` exports TS tokens
- [ ] No component with more than 300 lines (split if larger)
- [ ] No duplicate constants across files (CATEGORY_COLORS etc.)

### Analytics

- [ ] PostHog installed and receiving events
- [ ] All 25 events in Section 18 firing at correct trigger points
- [ ] TTFU query documented and baseline measured
- [ ] Funnel visible in PostHog dashboard

---

## 22. Risks & Trade-offs

### Risk 1: Onboarding simplification loses personalisation signal

**Risk:** Reducing to 3 questions means less data for personalisation.  
**Mitigation:** Prioritise completion over depth. Progressive profiling can collect more data from within the app over time (e.g. "Update your profile to get better suggestions" prompt after 3rd search).  
**Decision:** Accept the trade-off. 0.2% completion rate means zero personalisation currently. Even a 50% completion rate with 3 questions is infinitely more useful.

### Risk 2: Email verification gate increases drop-off before first unlock

**Risk:** Users who can't find the verification email will churn before experiencing core value.  
**Mitigation:** 
- Prominent resend button with one-click flow
- Verification banner is visible and actionable
- Users can search (experience partial value) while unverified
- Unlock gate shows clear instructions, not just a block

**Decision:** Accept a small drop-off increase in exchange for eliminating disposable-email abuse (which otherwise costs real unlock credits from the platform).

### Risk 3: Product preview on homepage sets wrong expectations

**Risk:** If the product preview card looks better than the real product, users will feel let-down on first login.  
**Mitigation:** Build the preview to reflect the actual current UI. Do not show features that don't exist. Update it as the product improves.

### Risk 4: Seeding opportunities manually creates maintenance burden

**Risk:** Manually seeded opportunities become stale and out-of-date, embarrassing the platform.  
**Mitigation:** Add `expires_at` to all manually seeded opportunities. Set expirations at 30–60 days. Build a cron job that auto-removes expired opportunities from the listing.

### Risk 5: Marketing site and web app diverging design systems

**Risk:** Two separate Next.js apps with two separate `globals.css` files will continue to drift.  
**Mitigation:** Create a shared `packages/ui` package for tokens and primitive components. This is a Phase 2+ concern. For now, manually keep tokens in sync between both `globals.css` files. Document this as a known debt.

### Risk 6: React Query installed but unused

**Risk:** Dead dependency adds to bundle size and causes confusion.  
**Mitigation:** Either use it (for the UnlocksProvider state, contact fetching) or remove it. If keeping: wrap all raw `fetch` + `useState` patterns in proper `useQuery` hooks. If removing: `pnpm remove @tanstack/react-query --filter @footy/web`.

---

## 23. Quick Wins vs Deeper Rebuild

### Quick wins (can ship in 1–3 days each)

| Win | Effort | Impact |
|---|---|---|
| Fix auth callback `next` param | 30 min | Critical: unblocks password reset flow |
| Fix 404 on opportunities detail | 2–4 hours | Stops every opportunity click being a dead end |
| Fix emoji encoding in onboarding | 1 hour | Stops garbage characters appearing |
| Display error query params on login | 1 hour | Users who click expired links now get context |
| Remove Google OAuth buttons | 30 min | Spec compliance |
| Remove ReactQueryDevtools from production | 15 min | Bundle size, cleanliness |
| Narrow middleware profile select | 30 min | Performance + security |
| Fix back nav to use `<Link>` not `<a>` | 30 min | Eliminates hard page reload on back button |
| Add "Showing 25 of X results" with upgrade CTA | 2 hours | Free users understand the cap and see an upgrade path |
| Change WelcomeBanner to use DB flag | 2 hours | Multi-device correct behaviour |

### Deeper rebuild (1–2 weeks each)

| Rebuild | Effort | Impact |
|---|---|---|
| Homepage full redesign | 1–2 weeks | Top of funnel conversion |
| Onboarding extraction + new flow | 1 week | Onboarding completion 0.2% → 60% |
| Sign up / sign in rewrite | 3–5 days | Auth conversion + security |
| Component library (`/components/ui/`) | 1 week | Enables all subsequent pages to be built faster and consistently |
| Unlock flow redesign | 3–5 days | TTFU reduction |
| Server-side field protection (RPC) | 2–3 days | P0 security fix |
| PostHog analytics instrumentation | 3–5 days | Measurement capability |

---

## 24. What Not to Build Yet

These features are on the product roadmap but should not be built during this phase:

| Feature | Reason to defer |
|---|---|
| Team seats / multi-user Agency | Complex auth model. No paying customers yet to need it. |
| Saved search email alerts | Cron infrastructure works, but requires a base of returning users to create value. Build after first 10 paying subscribers. |
| CRM notes on contacts | Nice feature, but adds DB complexity. Build after core unlock flow is working and proven. |
| Unlock top-up packs | Requires Stripe one-time payment products. Defer until subscription model is working. |
| Player profile listings | Two-sided marketplace feature. Build after the single-sided (search) product is working. |
| Referral programme | Build after first paying subscribers prove the model. Referral of what? Unproven product. |
| Opportunity posting for paid users | Build after manually seeded opportunities prove demand. |
| A/B testing beyond PostHog feature flags | Overkill at 743 users. PostHog flags are sufficient. |
| Mobile app (`apps/mobile`) | Web product must work first. Mobile is a retention play for an established product. |
| Bulk export UI | Export API exists. Build the UI after first paying subscribers request it. |
| Custom domain for API / subdomain routing | Infrastructure concern. Current `app.footycontacts.com` setup is fine. |

---

*End of LAUNCH_PLAN.md*

*This document is the authoritative product and implementation plan for Footy Contacts revamp, May 2026.*  
*Execute Phase 0 first. Do not skip security fixes for speed.*
