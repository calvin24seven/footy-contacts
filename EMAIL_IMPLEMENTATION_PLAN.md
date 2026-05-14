# A+ Email Processing & Sending — Implementation Plan (v2, corrected)
**Stack**: Next.js 15 · Supabase · Upstash Redis · Resend · Sentry · React Email · Vercel Cron

> **v2 corrections**: atomic queue claiming via `FOR UPDATE SKIP LOCKED` RPC,
> correct RLS model (`REVOKE ALL` on `email_jobs`; no user-facing email job access in v1), Resend provider
> idempotency key (256-char, 24-hr), Svix library webhook verification on raw body,
> `email_events` append-only log, `text/plain` alongside HTML, transactional vs marketing
> separation with suppression-type awareness, Zod prop validation per template,
> business-event idempotency keys, `locked_at` column, Vercel Hobby cron gate.

---

## 1. Architecture Decision: Template Strategy

### Decision: React Email (code-first) — NOT Resend Dashboard Templates

| Criterion | React Email (code) | Resend Templates (GUI) |
|---|---|---|
| Version control | ✅ Git-tracked, PR-reviewable | ❌ Stored in Resend dashboard |
| Type safety | ✅ TypeScript + Zod props, compile errors | ❌ String interpolation |
| CI/CD preview | ✅ `npx email dev` + snapshot tests | ❌ Manual dashboard checks |
| Vendor lock-in | ✅ Swap Resend → SES anytime | ❌ Templates tied to Resend |
| Personalisation | ✅ Full JSX logic, loops, conditionals | ⚠️ Limited Handlebars |
| Secrets in templates | ✅ Never exposed — rendered server-side | ⚠️ Template editor could leak |

**Verdict**: React Email templates live in `apps/web/src/lib/email/templates/`. Resend receives fully-rendered HTML + plain text. Resend is a delivery transport only — never a template store.

---

## 2. Overall Architecture

```
Product event (signup / export / unlock / etc.)
         │
         ▼
  [API Route — Node runtime]
         │  enqueueEmail() ← validates template + props (Zod), rate-limits
         ▼
  ┌───────────────────────────────┐
  │  email_jobs  (status=pending)  │  ← idempotency_key UNIQUE
  └───────────────────────────────┘
         │  Vercel Cron → /api/cron/email-drain
         ▼
  claim_email_jobs() RPC         ← FOR UPDATE SKIP LOCKED
  status = sending, locked_at = now()
         │
         ▼
  sendClaimedEmailJob()
  ├─ check email_suppressions (category-aware)
  ├─ render React Email → HTML + text/plain
  ├─ Resend.send({ idempotencyKey })  ← provider-level idempotency
  └─ status = sent, resend_message_id saved
         │
         ▼
  POST /api/webhooks/resend       ← Svix.verify() on raw body
  ├─ upsert email_events (UNIQUE provider + event_id)
  ├─ status = delivered / bounced / complained
  └─ bounce/complaint → email_suppressions
         │
         ▼
  Sentry: spans + DLQ alerts + Crons monitors
```

**Invariants**:
- App code **never calls Resend directly** from user-facing flows — only `enqueueEmail()`
- Queue claiming is **atomic** — `FOR UPDATE SKIP LOCKED` prevents duplicate claiming across concurrent workers
- Every email has a **stable business idempotency key** (`welcome:${userId}`, `export-ready:${exportId}`)
- Resend receives the same key as a **provider idempotency key** — two independent layers of duplicate prevention
- Users **cannot read `email_jobs` directly** — `REVOKE ALL`, no user-facing email status access in v1

---

## 3. Phase 0 — Pre-implementation Audit

Complete before writing any code.

| Item | Task | Acceptance criterion |
|---|---|---|
| Secrets | `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`, `CRON_SECRET`, Sentry vars | All reachable via `getSecret()` |
| Runtime | Email routes declare `export const runtime = "nodejs"` | Confirmed — not Edge |
| Vercel plan | Plan supports required cron frequency | Pro → `*/2 * * * *`; Hobby → 1/day only |
| Sending domain | `footycontacts.com` DNS accessible | SPF/DKIM/DMARC records can be added |
| Email inventory | Every email flow in the codebase listed | All categorised transactional or marketing |

---

## 4. Data Model

### Migration: `supabase/migrations/20260514_email_queue.sql`

```sql
-- ============================================================
-- Email Job Queue, Suppressions, Events
-- ============================================================

CREATE TYPE public.email_job_status AS ENUM (
  'pending',
  'sending',
  'sent',
  'delivered',
  'delivery_delayed',
  'bounced',
  'complained',
  'failed',
  'cancelled'
);

CREATE TYPE public.email_suppression_reason AS ENUM (
  'bounce',
  'complaint',
  'unsubscribe',
  'manual',
  'invalid'
);

-- ── email_jobs ──────────────────────────────────────────────
CREATE TABLE public.email_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key text NOT NULL UNIQUE,
  status          public.email_job_status NOT NULL DEFAULT 'pending',

  to_email        text NOT NULL,
  to_name         text,
  reply_to        text,

  template_id     text NOT NULL,
  template_props  jsonb NOT NULL DEFAULT '{}'::jsonb,

  category        text NOT NULL DEFAULT 'transactional',  -- 'transactional' | 'marketing'
  provider        text NOT NULL DEFAULT 'resend',
  resend_message_id text,

  attempt_count   integer NOT NULL DEFAULT 0,
  max_attempts    integer NOT NULL DEFAULT 5,
  next_retry_at   timestamptz,
  locked_at       timestamptz,   -- set on claim; used to detect stale locks
  last_error      text,

  user_id         uuid REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  sent_at         timestamptz,
  delivered_at    timestamptz,
  failed_at       timestamptz,
  cancelled_at    timestamptz,

  CONSTRAINT email_jobs_idempotency_key_length    CHECK (length(idempotency_key) BETWEEN 8 AND 256),
  CONSTRAINT email_jobs_attempt_count_nonnegative CHECK (attempt_count >= 0),
  CONSTRAINT email_jobs_max_attempts_valid        CHECK (max_attempts BETWEEN 1 AND 10),
  CONSTRAINT email_jobs_to_email_lower            CHECK (to_email = lower(trim(to_email))),
  CONSTRAINT email_jobs_category_valid            CHECK (category IN ('transactional', 'marketing')),
  CONSTRAINT email_jobs_provider_valid            CHECK (provider IN ('resend')),
  -- Prevent template_props becoming a dumping ground — no files, lists, or secrets
  CONSTRAINT email_jobs_template_props_size       CHECK (pg_column_size(template_props) < 8192)
);

-- ── email_suppressions ──────────────────────────────────────
-- category = 'all'       → blocks all mail (bounce / complaint / manual / invalid)
-- category = 'marketing' → blocks marketing sends only (unsubscribe)
-- UNIQUE(email, category, reason) allows fine-grained per-scope suppression.
CREATE TABLE public.email_suppressions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL,
  reason     public.email_suppression_reason NOT NULL,
  -- 'all' | 'marketing' | 'transactional' — use 'all' for bounce/complaint
  category   text NOT NULL DEFAULT 'all',
  source     text,
  details    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (email, category, reason),
  CONSTRAINT email_suppressions_email_lower    CHECK (email = lower(trim(email))),
  CONSTRAINT email_suppressions_category_valid CHECK (category IN ('all', 'marketing', 'transactional'))
);

-- ── email_events (append-only webhook log) ──────────────────
CREATE TABLE public.email_events (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider          text NOT NULL DEFAULT 'resend',
  provider_event_id text NOT NULL,
  event_type        text NOT NULL,
  resend_message_id text,
  email_job_id      uuid REFERENCES public.email_jobs(id) ON DELETE SET NULL,
  payload           jsonb NOT NULL,
  received_at       timestamptz NOT NULL DEFAULT now(),

  UNIQUE (provider, provider_event_id)  -- idempotent webhook replay
);

-- ── Indexes ─────────────────────────────────────────────────
CREATE INDEX idx_email_jobs_pending_drain
  ON public.email_jobs (next_retry_at NULLS FIRST, created_at)
  WHERE status = 'pending';

CREATE INDEX idx_email_jobs_status_created
  ON public.email_jobs (status, created_at);

CREATE INDEX idx_email_jobs_resend_message_id
  ON public.email_jobs (resend_message_id)
  WHERE resend_message_id IS NOT NULL;

CREATE INDEX idx_email_jobs_user_id
  ON public.email_jobs (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX idx_email_suppressions_email
  ON public.email_suppressions (email);

CREATE INDEX idx_email_events_resend_message_id
  ON public.email_events (resend_message_id)
  WHERE resend_message_id IS NOT NULL;

-- ── auto-update updated_at ───────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_email_jobs_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_email_jobs_updated_at
  BEFORE UPDATE ON public.email_jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_email_jobs_updated_at();

-- ── Normalise email addresses before insert/update ──────────
-- CHECK constraints are a safety net; triggers are the primary enforcement mechanism.
CREATE OR REPLACE FUNCTION public.normalize_email_to_lower()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.to_email = lower(trim(NEW.to_email));
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_email_jobs_normalize_email
  BEFORE INSERT OR UPDATE ON public.email_jobs
  FOR EACH ROW EXECUTE FUNCTION public.normalize_email_to_lower();

CREATE OR REPLACE FUNCTION public.normalize_suppression_email()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.email = lower(trim(NEW.email));
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_email_suppressions_normalize_email
  BEFORE INSERT OR UPDATE ON public.email_suppressions
  FOR EACH ROW EXECUTE FUNCTION public.normalize_suppression_email();

-- ── RLS — service role only; no user-facing access in v1 ────
-- template_props may contain PII. Users must NEVER read email_jobs directly.
-- Access only via service role (SUPABASE_SERVICE_ROLE_KEY), which bypasses RLS.
-- A user-facing status view can be added later using a SECURITY INVOKER view + explicit RLS.
ALTER TABLE public.email_jobs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_events        ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.email_jobs         FROM anon, authenticated;
REVOKE ALL ON public.email_suppressions FROM anon, authenticated;
REVOKE ALL ON public.email_events        FROM anon, authenticated;
```

### Migration: `supabase/migrations/20260514_email_queue_functions.sql`

```sql
-- ============================================================
-- Atomic claim + stuck-job recovery
-- ============================================================

-- Atomically claims a batch of pending jobs.
-- FOR UPDATE SKIP LOCKED: concurrent workers skip rows already locked,
-- preventing any job from being claimed by two workers simultaneously.
CREATE OR REPLACE FUNCTION public.claim_email_jobs(batch_size integer)
RETURNS SETOF public.email_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH claimed AS (
    SELECT id
    FROM public.email_jobs
    WHERE status = 'pending'
      AND (next_retry_at IS NULL OR next_retry_at <= now())
    ORDER BY created_at ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.email_jobs ej
  SET
    status        = 'sending',
    attempt_count = ej.attempt_count + 1,
    locked_at     = now(),
    updated_at    = now()
  FROM claimed
  WHERE ej.id = claimed.id
  RETURNING ej.*;
END;
$$;

-- Requeues jobs stuck in 'sending' after a serverless crash.
-- Returns the number of rows requeued.
CREATE OR REPLACE FUNCTION public.requeue_stuck_email_jobs(lock_minutes integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.email_jobs
  SET
    status        = 'pending',
    next_retry_at = now(),
    locked_at     = NULL,
    last_error    = 'Requeued after stale sending lock',
    updated_at    = now()
  WHERE status = 'sending'
    AND locked_at < now() - make_interval(mins => lock_minutes);

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- ── Restrict function execution to service role ──────────────
-- SECURITY DEFINER functions are dangerous if callable by anon or authenticated.
REVOKE EXECUTE ON FUNCTION public.claim_email_jobs(integer)         FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.requeue_stuck_email_jobs(integer)  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.claim_email_jobs(integer)         TO service_role;
GRANT EXECUTE ON FUNCTION public.requeue_stuck_email_jobs(integer)  TO service_role;

-- Admin: retry a specific failed job (resets to pending for the next drain run)
CREATE OR REPLACE FUNCTION public.retry_failed_email_job(job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.email_jobs
  SET
    status        = 'pending',
    next_retry_at = now(),
    locked_at     = NULL,
    failed_at     = NULL,
    last_error    = NULL,
    updated_at    = now()
  WHERE id     = job_id
    AND status = 'failed';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.retry_failed_email_job(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.retry_failed_email_job(uuid) TO service_role;

-- DLQ view (no template_props)
CREATE OR REPLACE VIEW public.email_dlq AS
  SELECT id, idempotency_key, to_email, template_id, category,
         attempt_count, max_attempts, last_error,
         created_at, failed_at
  FROM public.email_jobs
  WHERE status = 'failed'
  ORDER BY failed_at DESC;

-- email_dlq still contains to_email (PII); lock down to service role even though
-- it is not directly exposed via PostgREST — belt-and-suspenders.
REVOKE ALL ON public.email_dlq FROM anon, authenticated;
```

---

## 5. File Structure

```
apps/web/src/lib/email/
├── client.ts          ← Resend SDK singleton
├── enqueue.ts         ← enqueueEmail() — Zod validate + insert email_jobs
├── sender.ts          ← sendClaimedEmailJob() — suppress check, render, send
├── drain.ts           ← drainEmailQueue() — called by cron
├── rate-limit.ts      ← per-user/template Upstash rate limiting
├── unsubscribe.ts     ← createUnsubscribeToken() / verifyUnsubscribeToken()
└── templates/
    ├── index.ts       ← TEMPLATES registry with Zod schemas + category
    ├── _base.tsx      ← shared layout (header, footer, optional unsubscribe)
    ├── welcome.tsx
    ├── export-ready.tsx
    └── unlock-confirmation.tsx

apps/web/src/app/api/
├── cron/
│   └── email-drain/
│       └── route.ts   ← GET, cron secret, Node runtime, drains queue
├── email/
│   └── unsubscribe/
│       └── route.ts   ← GET + POST, verifies signed token, inserts suppression
└── webhooks/
    └── resend/
        └── route.ts   ← POST, Svix verify, stores email_events

apps/web/src/app/unsubscribed/
└── page.tsx           ← confirmation UI; renders "Confirm" button that POSTs
                          email/category/token back to /api/email/unsubscribe
```

---

## 6. Implementation

### 6.1 Install packages

```bash
pnpm --filter web add resend react-email @react-email/components @sentry/nextjs svix
```

`svix` is the official Svix verification library — Resend uses Svix for webhook signing.

### 6.2 `lib/email/client.ts`

```typescript
import { Resend } from "resend"
import { getSecret } from "@/lib/secrets"

let _client: Resend | null = null

export function getResendClient(): Resend {
  if (_client) return _client
  _client = new Resend(getSecret("resend_api_key"))
  return _client
}
```

### 6.3 `lib/email/templates/index.ts`

```typescript
import { z } from "zod"
import type { ReactElement } from "react"
import WelcomeEmail from "./welcome"
import ExportReadyEmail from "./export-ready"
import UnlockConfirmationEmail from "./unlock-confirmation"

export interface TemplateDefinition<S extends z.ZodTypeAny> {
  schema: S
  component: (props: z.infer<S>) => ReactElement
  subject: (props: z.infer<S>) => string
  /** 'transactional' emails bypass marketing unsubscribes.
   *  'marketing' emails must respect List-Unsubscribe and suppression table. */
  category: "transactional" | "marketing"
}

const WelcomeSchema = z.object({
  firstName: z.string().min(1).max(80),
})

const ExportReadySchema = z.object({
  fileName:    z.string().min(1).max(120),
  downloadUrl: z.string().url(),
  rowCount:    z.number().int().nonnegative(),
})

const UnlockConfirmationSchema = z.object({
  contactName: z.string().min(1).max(120),
  contactRole: z.string().max(80).optional(),
})

export const TEMPLATES = {
  welcome: {
    schema:    WelcomeSchema,
    component: WelcomeEmail,
    subject:   () => "Welcome to Footy Contacts",
    category:  "transactional",
  },
  "export-ready": {
    schema:    ExportReadySchema,
    component: ExportReadyEmail,
    subject:   ({ fileName }) => `Your export "${fileName}" is ready`,
    category:  "transactional",
  },
  "unlock-confirmation": {
    schema:    UnlockConfirmationSchema,
    component: UnlockConfirmationEmail,
    subject:   ({ contactName }) => `Contact unlocked: ${contactName}`,
    category:  "transactional",
  },
} as const satisfies Record<string, TemplateDefinition<z.ZodTypeAny>>

export type TemplateId = keyof typeof TEMPLATES
```

### 6.4 `lib/email/rate-limit.ts`

```typescript
import { rateLimit } from "@/lib/rate-limit"
import type { TemplateId } from "./templates"

interface EmailRateLimitOptions {
  userId: string | undefined
  email: string
  templateId: TemplateId
}

/**
 * Per-template, per-user limits — prevents one template from starving others.
 * High-frequency templates (unlock-confirmation) get higher limits than low-frequency ones.
 */
const TEMPLATE_LIMITS: Record<string, { requests: number; window: string }> = {
  "welcome":             { requests: 3,  window: "1h" },
  "export-ready":        { requests: 20, window: "1h" },
  "unlock-confirmation": { requests: 50, window: "1h" },
}
const DEFAULT_LIMIT = { requests: 10, window: "1h" }

export async function assertEmailRateLimit(opts: EmailRateLimitOptions): Promise<void> {
  if (!opts.userId) return

  const limit = TEMPLATE_LIMITS[opts.templateId] ?? DEFAULT_LIMIT
  // Key includes templateId so one template's usage does not block another
  const key   = `email:enqueue:${opts.userId}:${opts.templateId}`
  const result = await rateLimit(key, limit)

  if (!result.allowed) {
    throw new Error(
      `Email rate limit exceeded for user ${opts.userId} (template: ${opts.templateId}). ` +
      `Resets at ${new Date(result.resetAt).toISOString()}.`
    )
  }
}
```

### 6.5 `lib/email/enqueue.ts`

Idempotency keys must be **stable business-event identifiers**, not hashes of props:

| Template | Key pattern |
|---|---|
| `welcome` | `welcome:${userId}` |
| `export-ready` | `export-ready:${exportId}` |
| `unlock-confirmation` | `unlock-confirmation:${unlockId}` |

```typescript
import { createAdminClient } from "@/lib/supabase/admin"
import { TEMPLATES, type TemplateId } from "./templates"
import { assertEmailRateLimit } from "./rate-limit"
import * as Sentry from "@sentry/nextjs"

export interface EnqueueEmailOptions {
  /** Stable business-event key — e.g. "welcome:user_123" */
  idempotencyKey: string
  to: { email: string; name?: string }
  replyTo?: string
  templateId: TemplateId
  templateProps: Record<string, unknown>
  userId?: string
  maxAttempts?: number
  sendAfter?: Date
}

/**
 * Enqueues an email job. Returns job ID, or null if already enqueued (idempotent).
 */
export async function enqueueEmail(opts: EnqueueEmailOptions): Promise<string | null> {
  const template = TEMPLATES[opts.templateId]

  // Validate props against template's Zod schema — throws on invalid input
  const parsedProps = template.schema.parse(opts.templateProps)

  const toEmail = opts.to.email.toLowerCase().trim()

  await assertEmailRateLimit({
    userId:     opts.userId,
    email:      toEmail,
    templateId: opts.templateId,
  })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("email_jobs")
    .upsert(
      {
        idempotency_key: opts.idempotencyKey,
        to_email:        toEmail,
        to_name:         opts.to.name ?? null,
        reply_to:        opts.replyTo ?? null,
        template_id:     opts.templateId,
        template_props:  parsedProps,
        category:        template.category,
        user_id:         opts.userId ?? null,
        max_attempts:    opts.maxAttempts ?? 5,
        next_retry_at:   opts.sendAfter?.toISOString() ?? null,
        status:          "pending",
      },
      {
        onConflict:       "idempotency_key",
        ignoreDuplicates: true,  // second call with same key is a no-op
      }
    )
    .select("id")
    .maybeSingle()

  if (error) {
    Sentry.captureException(error, {
      tags:  { component: "email-enqueue", template: opts.templateId },
      extra: { idempotencyKey: opts.idempotencyKey },
    })
    throw new Error(`Failed to enqueue email: ${error.message}`)
  }

  return data?.id ?? null
}
```

### 6.6 `lib/email/sender.ts`

```typescript
import { render } from "@react-email/render"
import { getResendClient } from "./client"
import { TEMPLATES } from "./templates"
import { createUnsubscribeToken } from "./unsubscribe"
import { createAdminClient } from "@/lib/supabase/admin"
import * as Sentry from "@sentry/nextjs"

const FROM_TRANSACTIONAL = "Footy Contacts <noreply@footycontacts.com>"
const FROM_MARKETING     = "Footy Contacts <hello@footycontacts.com>"
const UNSUBSCRIBE_BASE   = "https://footycontacts.com/unsubscribe"

/** Shape of a job row returned by the claim_email_jobs() RPC. Exported for drain.ts. */
export type ClaimedEmailJob = {
  id: string
  idempotency_key: string
  to_email: string
  to_name: string | null
  reply_to: string | null
  template_id: string
  template_props: Record<string, unknown>
  category: "transactional" | "marketing"
  attempt_count: number
  max_attempts: number
}

/** Called with a job row already in 'sending' status (claimed by RPC). */
export async function sendClaimedEmailJob(job: ClaimedEmailJob): Promise<void> {
  const supabase = createAdminClient()

  return await Sentry.startSpan(
    {
      name:       "email.send",
      op:         "email",
      attributes: {
        "email.template": job.template_id,
        "email.category": job.category,
      },
    },
    async () => {
      try {
        // ── 1. Suppression check (category-aware) ────────────
        // category='all'       → blocks every email (bounce/complaint/manual/invalid)
        // category='marketing' → blocks marketing sends only (unsubscribe)
        // Fetch any suppression matching this email + this job's category OR 'all'
        const { data: suppressions } = await supabase
          .from("email_suppressions")
          .select("reason, category")
          .eq("email", job.to_email)
          .in("category", ["all", job.category])

        if (suppressions && suppressions.length > 0) {
          await supabase
            .from("email_jobs")
            .update({
              status:       "cancelled",
              cancelled_at: new Date().toISOString(),
              locked_at:    null,
              last_error:   `Suppressed: ${suppressions[0].reason} (scope: ${suppressions[0].category})`,
            })
            .eq("id", job.id)
          return
        }

        // ── 2. Render template ────────────────────────────────
        const templateId = job.template_id as keyof typeof TEMPLATES
        if (!TEMPLATES[templateId]) throw new Error(`Unknown template: ${job.template_id}`)

        // Re-validate props at send time — guards against DB corruption, schema drift,
        // manual edits, or props written before a breaking template change.
        // renderTemplate() is a typed helper that keeps each template's schema and
        // component matched, avoiding the need for `any` casts in the call site.
        const { element, subject } = renderTemplate(templateId, job.template_props)
        const html = await render(element)
        const text = await render(element, { plainText: true })

        // ── 3. Build send options ─────────────────────────────
        const from      = job.category === "transactional" ? FROM_TRANSACTIONAL : FROM_MARKETING
        const recipient = job.to_name
          ? `${job.to_name} <${job.to_email}>`
          : job.to_email

        const headers: Record<string, string> = {}
        if (job.category === "marketing") {
          // RFC 8058 one-click unsubscribe — mandatory for bulk/marketing sends
          // Token is HMAC-signed so recipients cannot unsubscribe arbitrary addresses.
          // category is explicit in the URL so the route does not rely on a default.
          const unsubCategory = "marketing"
          const unsubToken    = createUnsubscribeToken(job.to_email, unsubCategory)
          const unsubUrl      =
            `${UNSUBSCRIBE_BASE}?email=${encodeURIComponent(job.to_email)}&category=${unsubCategory}&token=${unsubToken}`
          // Dual format: mailto fallback for legacy clients, URL for modern one-click
          headers["List-Unsubscribe"] =
            `<mailto:unsubscribe@footycontacts.com?subject=unsubscribe>, <${unsubUrl}>`
          headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click"
        }

        // ── 4. Send via Resend with provider idempotency key ──
        // idempotencyKey maps to Resend's provider-level de-duplication.
        // Max 256 chars, 24-hour expiry. Two-layer protection on top of DB unique.
        const resend = getResendClient()
        const { data: sent, error: sendErr } = await resend.emails.send(
          {
            from,
            to:      recipient,
            replyTo: job.reply_to ?? undefined,
            subject,
            html,
            text,
            headers,
          },
          {
            idempotencyKey: job.idempotency_key.slice(0, 256),
          }
        )

        if (sendErr) throw sendErr

        await supabase
          .from("email_jobs")
          .update({
            status:            "sent",
            resend_message_id: sent!.id,
            sent_at:           new Date().toISOString(),
            locked_at:         null,
          })
          .eq("id", job.id)

      } catch (err) {
        await handleSendFailure(job.id, job.attempt_count, job.max_attempts, String(err))
        Sentry.captureException(err, {
          tags:  { component: "email-sender", template: job.template_id },
          // NEVER include template_props — may contain PII
          extra: { jobId: job.id, attemptCount: job.attempt_count },
        })
        throw err
      }
    }
  )
}

/**
 * Typed render helper — infers the correct props type per template so that
 * schema.parse(), component(), and subject() are all consistent.
 * Isolates the one unavoidable Zod `unknown → T` cast in a single place.
 */
function renderTemplate<K extends keyof typeof TEMPLATES>(
  templateId: K,
  rawProps: unknown
): { element: ReturnType<(typeof TEMPLATES)[K]["component"]>; subject: string } {
  const template    = TEMPLATES[templateId]
  const parsedProps = template.schema.parse(rawProps) as Parameters<(typeof TEMPLATES)[K]["component"]>[0]
  return {
    element: template.component(parsedProps) as ReturnType<(typeof TEMPLATES)[K]["component"]>,
    subject: template.subject(parsedProps),
  }
}

async function handleSendFailure(
  jobId: string,
  attemptCount: number,  // already incremented by the claim RPC
  maxAttempts: number,
  errorMsg: string
): Promise<void> {
  const supabase  = createAdminClient()
  const exhausted = attemptCount >= maxAttempts
  // Exponential backoff: 2^attempt minutes (2→4→8→16→32 min)
  const backoffMs = Math.pow(2, attemptCount) * 60 * 1000

  await supabase
    .from("email_jobs")
    .update({
      status:        exhausted ? "failed"  : "pending",
      last_error:    errorMsg.slice(0, 2000),
      next_retry_at: exhausted ? null : new Date(Date.now() + backoffMs).toISOString(),
      locked_at:     null,
      failed_at:     exhausted ? new Date().toISOString() : null,
    })
    .eq("id", jobId)

  if (exhausted) {
    Sentry.captureMessage("Email job exhausted retries → DLQ", {
      level: "error",
      tags:  { component: "email-dlq" },
      extra: { jobId, errorMsg: errorMsg.slice(0, 500) },
    })
  }
}
```

### 6.7 `lib/email/drain.ts`

```typescript
import { createAdminClient } from "@/lib/supabase/admin"
import { sendClaimedEmailJob, type ClaimedEmailJob } from "./sender"
import * as Sentry from "@sentry/nextjs"

const BATCH_SIZE   = 25  // safe below Resend's 100 req/s limit
const LOCK_MINUTES = 5   // requeue jobs stuck in 'sending' longer than this

export async function drainEmailQueue(): Promise<{
  requeued: number
  claimed:  number
  sent:     number
  failed:   number
}> {
  const supabase = createAdminClient()

  // Recover jobs stuck in 'sending' from a crashed prior invocation
  const { data: requeued } = await supabase.rpc(
    "requeue_stuck_email_jobs",
    { lock_minutes: LOCK_MINUTES }
  )

  // Atomically claim a batch — FOR UPDATE SKIP LOCKED inside the RPC
  const { data: jobs, error: claimErr } = await supabase.rpc(
    "claim_email_jobs",
    { batch_size: BATCH_SIZE }
  )

  if (claimErr) {
    Sentry.captureException(claimErr, { tags: { component: "email-drain" } })
    return { requeued: requeued ?? 0, claimed: 0, sent: 0, failed: 0 }
  }

  // Alert if DLQ has unresolved jobs
  const { count: dlqCount } = await supabase
    .from("email_jobs")
    .select("id", { count: "exact", head: true })
    .eq("status", "failed")

  if (dlqCount && dlqCount > 0) {
    Sentry.captureMessage(`Email DLQ has ${dlqCount} unresolved job(s)`, {
      level: "error",
      tags:  { component: "email-dlq" },
      extra: { dlqCount },
    })
  }

  const claimedJobs = (jobs ?? []) as ClaimedEmailJob[]
  const results = await Promise.allSettled(
    claimedJobs.map((job) => sendClaimedEmailJob(job))
  )

  return {
    requeued: requeued ?? 0,
    claimed:  claimedJobs.length,
    sent:     results.filter((r) => r.status === "fulfilled").length,
    failed:   results.filter((r) => r.status === "rejected").length,
  }
}
```

### 6.8 `app/api/cron/email-drain/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server"
import { getSecret } from "@/lib/secrets"
import { drainEmailQueue } from "@/lib/email/drain"

export const runtime    = "nodejs"
export const maxDuration = 60  // Vercel Pro: up to 300 s; Hobby capped at 10 s

export async function GET(req: NextRequest): Promise<NextResponse> {
  let cronSecret: string
  try { cronSecret = getSecret("cron_secret") } catch {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 })
  }

  if ((req.headers.get("authorization") ?? "") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const stats = await drainEmailQueue()
    return NextResponse.json({ ok: true, ...stats })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
```

> **Cron auth — Vercel Cron does not inject a custom `Authorization` header automatically.**
> Confirm before deployment how `CRON_SECRET` reaches the route:
> 1. **External scheduler** (Upstash QStash, GitHub Actions) — configure it to send `Authorization: Bearer CRON_SECRET`
> 2. **Vercel with deployment protection** — Vercel injects `x-vercel-cron: 1` on cron requests; validate both that header and `CRON_SECRET` as belt-and-suspenders
> 3. **Vercel without additional config** — the cron call has no auth header by default; the route returns `401` on every invocation
>
> Without resolving this, the cron will silently fail. Add this as a Phase 0 audit item.

### 6.9 `app/api/webhooks/resend/route.ts`

Uses the **`svix` npm library** for verification — Resend's documented approach.
Verification runs on the **raw request body** before any parsing.

**Key corrections from v2**:
- `provider_event_id` = **`svix-id` header** (unique per webhook delivery), NOT `event.data.email_id` — one email generates many events (`sent`, `delivered`, `opened`, `bounced`…); using `email_id` as the unique key silently drops every event after the first
- Status transitions are **guarded** with `.in("status", [...])` — stale or out-of-order webhooks cannot regress a terminal state
- `ResendWebhookEvent` type is **defensive** — unknown fields are accepted rather than crashing

```typescript
import { NextRequest, NextResponse } from "next/server"
import { Webhook } from "svix"
import { createAdminClient } from "@/lib/supabase/admin"
import { getSecret } from "@/lib/secrets"
import * as Sentry from "@sentry/nextjs"

export const runtime = "nodejs"

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Raw body must be read before any parsing — signature covers exact bytes
  const rawBody = await req.text()
  const svixId  = req.headers.get("svix-id") ?? ""

  // Svix verification — Resend's prescribed approach
  const wh = new Webhook(getSecret("resend_webhook_secret"))
  let event: ResendWebhookEvent

  try {
    event = wh.verify(rawBody, {
      "svix-id":        svixId,
      "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
      "svix-signature": req.headers.get("svix-signature") ?? "",
    }) as ResendWebhookEvent
  } catch {
    Sentry.captureMessage("Invalid Resend webhook signature", {
      level: "warning",
      tags:  { component: "email-webhook" },
    })
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }

  // Defensive guard — email_id required for all status-updating events
  const emailId = event.data?.email_id
  if (!emailId) {
    Sentry.captureMessage("Resend webhook missing email_id", {
      level: "warning",
      tags:  { component: "email-webhook" },
      extra: { eventType: event.type },
    })
    return NextResponse.json({ received: true, ignored: true })
  }

  const supabase = createAdminClient()

  // ── 1. Store event idempotently ─────────────────────────────────────────
  // KEY: provider_event_id = svix-id header (unique per webhook delivery).
  // Do NOT use event.data.email_id — one email sends many events and using
  // email_id would cause events 2+ to be treated as duplicates and dropped.
  const { data: stored } = await supabase
    .from("email_events")
    .upsert(
      {
        provider:          "resend",
        provider_event_id: svixId,          // ← svix-id header, not email_id
        event_type:        event.type,
        resend_message_id: emailId,
        payload:           event as unknown as Record<string, unknown>,
      },
      { onConflict: "provider,provider_event_id", ignoreDuplicates: true }
    )
    .select("id")
    .maybeSingle()

  if (!stored) {
    // Duplicate webhook delivery — Resend retried; already processed
    return NextResponse.json({ received: true, duplicate: true })
  }

  // Link event to job for admin queries
  const { data: job } = await supabase
    .from("email_jobs")
    .select("id")
    .eq("resend_message_id", emailId)
    .maybeSingle()

  if (job) {
    await supabase
      .from("email_events")
      .update({ email_job_id: job.id })
      .eq("id", stored.id)
  } else {
    // Rare: webhook arrived before sender.ts saved resend_message_id, or job was deleted.
    // Logged at warning — link can be reconciled later by querying email_events on emailId.
    Sentry.captureMessage("Resend webhook could not link to email job", {
      level: "warning",
      tags:  { component: "email-webhook" },
      extra: { emailId, eventType: event.type },
    })
  }

  // ── 2. Apply event state (guarded transitions) ──────────────────────────
  // .in("status", [...]) prevents out-of-order webhooks from regressing terminal states.
  switch (event.type) {
    case "email.sent": {
      // Already marked sent by sender.ts after Resend accepted.
      // Store event only — no state transition needed.
      break
    }
    case "email.delivered": {
      // Non-terminal predecessor states only
      const { error: deliveredErr } = await supabase
        .from("email_jobs")
        .update({ status: "delivered", delivered_at: event.created_at })
        .eq("resend_message_id", emailId)
        .in("status", ["sent", "delivery_delayed"])
      if (deliveredErr) Sentry.captureException(deliveredErr, {
        tags: { component: "email-webhook", eventType: event.type }, extra: { emailId },
      })
      break
    }
    case "email.delivery_delayed": {
      // Non-terminal — can still move to delivered, bounced, complained
      const { error: delayedErr } = await supabase
        .from("email_jobs")
        .update({ status: "delivery_delayed" })
        .eq("resend_message_id", emailId)
        .in("status", ["sent", "delivery_delayed"])
      if (delayedErr) Sentry.captureException(delayedErr, {
        tags: { component: "email-webhook", eventType: event.type }, extra: { emailId },
      })
      break
    }
    case "email.bounced": {
      const { error: bouncedErr } = await supabase
        .from("email_jobs")
        .update({ status: "bounced" })
        .eq("resend_message_id", emailId)
        .in("status", ["sent", "delivered", "delivery_delayed"])
      if (bouncedErr) Sentry.captureException(bouncedErr, {
        tags: { component: "email-webhook", eventType: event.type }, extra: { emailId },
      })
      // Hard bounce — suppress all mail to this address (category: all)
      const toEmailBounce = event.data.to?.[0]?.toLowerCase()
      if (toEmailBounce) {
        const { error: suppressErr } = await supabase
          .from("email_suppressions")
          .upsert(
            { email: toEmailBounce, reason: "bounce", category: "all", source: "resend-webhook" },
            { onConflict: "email,category,reason" }
          )
        if (suppressErr) Sentry.captureException(suppressErr, {
          tags: { component: "email-webhook", eventType: event.type }, extra: { emailId },
        })
      }
      break
    }
    case "email.complained": {
      const { error: complainedErr } = await supabase
        .from("email_jobs")
        .update({ status: "complained" })
        .eq("resend_message_id", emailId)
        .in("status", ["sent", "delivered", "delivery_delayed"])
      if (complainedErr) Sentry.captureException(complainedErr, {
        tags: { component: "email-webhook", eventType: event.type }, extra: { emailId },
      })
      const toEmailComplaint = event.data.to?.[0]?.toLowerCase()
      if (toEmailComplaint) {
        const { error: suppressErr } = await supabase
          .from("email_suppressions")
          .upsert(
            { email: toEmailComplaint, reason: "complaint", category: "all", source: "resend-webhook" },
            { onConflict: "email,category,reason" }
          )
        if (suppressErr) Sentry.captureException(suppressErr, {
          tags: { component: "email-webhook", eventType: event.type }, extra: { emailId },
        })
      }
      break
    }
    default: {
      // opened, clicked, etc. — stored in email_events above; no state transition needed
      break
    }
  }

  return NextResponse.json({ received: true })
}

// Defensive typing — Resend may send different shapes per event type.
// Use optional fields and validate before use rather than asserting a rigid structure.
type ResendWebhookEvent = {
  type: string
  created_at: string
  data: {
    email_id?: string
    from?: string
    to?: string[]
    subject?: string
    [key: string]: unknown
  }
  [key: string]: unknown
}
```

### 6.10 `lib/email/unsubscribe.ts`

HMAC-signed tokens prevent anyone from unsubscribing an arbitrary address by guessing a URL parameter.

```typescript
import { createHmac, timingSafeEqual } from "crypto"
import { getSecret } from "@/lib/secrets"

/**
 * Creates a tamper-proof token binding email + category together.
 * Used in List-Unsubscribe URLs and verified by the unsubscribe route.
 */
export function createUnsubscribeToken(email: string, category: string): string {
  const secret = getSecret("unsubscribe_secret")
  return createHmac("sha256", secret)
    .update(`${email.toLowerCase()}:${category}`)
    .digest("hex")
}

/**
 * Verifies an unsubscribe token. Timing-safe to prevent oracle attacks.
 */
export function verifyUnsubscribeToken(
  email: string,
  category: string,
  token: string
): boolean {
  try {
    const expected = createUnsubscribeToken(email, category)
    return timingSafeEqual(
      Buffer.from(token,    "hex"),
      Buffer.from(expected, "hex")
    )
  } catch {
    return false
  }
}
```

### 6.11 `app/api/email/unsubscribe/route.ts`

Handles both RFC 8058 one-click POST (from email clients) and user-initiated GET (from clicking the link).

```typescript
import { NextRequest, NextResponse } from "next/server"
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe"
import { createAdminClient } from "@/lib/supabase/admin"
import * as Sentry from "@sentry/nextjs"

export const runtime = "nodejs"

function parseUnsubParams(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  return {
    email:    searchParams.get("email")?.toLowerCase().trim() ?? null,
    category: searchParams.get("category") ?? "marketing",
    token:    searchParams.get("token") ?? null,
  }
}

/**
 * POST: perform the unsubscribe.
 * Called by RFC 8058 one-click from email clients, or by the confirmation page button.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const { email, category, token } = parseUnsubParams(req)

  if (!email || !token) {
    return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
  }

  if (!verifyUnsubscribeToken(email, category, token)) {
    Sentry.captureMessage("Invalid unsubscribe token on POST", {
      level: "warning",
      tags:  { component: "unsubscribe" },
    })
    return NextResponse.json({ error: "Invalid token" }, { status: 403 })
  }

  const supabase = createAdminClient()
  await supabase
    .from("email_suppressions")
    .upsert(
      { email, reason: "unsubscribe", category, source: "user-unsubscribe" },
      { onConflict: "email,category,reason" }
    )

  return NextResponse.json({ unsubscribed: true })
}

/**
 * GET: verify token, then redirect to confirmation page.
 * Does NOT perform the unsubscribe — avoids link-scanner / email-prefetch side effects.
 * The /unsubscribed page renders a "Confirm unsubscribe" button that submits POST back here.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { email, category, token } = parseUnsubParams(req)

  if (!email || !token || !verifyUnsubscribeToken(email, category, token)) {
    if (email && token) {
      Sentry.captureMessage("Invalid unsubscribe token on GET", {
        level: "warning",
        tags:  { component: "unsubscribe" },
      })
    }
    return NextResponse.redirect(new URL("/unsubscribed?error=invalid", req.url))
  }

  // Pass all params to the confirmation page so its form can POST back here
  const confirmUrl = new URL("/unsubscribed", req.url)
  confirmUrl.searchParams.set("email",    email)
  confirmUrl.searchParams.set("category", category)
  confirmUrl.searchParams.set("token",    token)
  return NextResponse.redirect(confirmUrl)
}
```

---

## 7. Sentry Setup — Next.js 15

### `apps/web/sentry.client.config.ts`

```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  beforeSend(event) {
    // Strip PII — never send email addresses to Sentry
    if (event.user) {
      delete event.user.email
      delete event.user.username
      delete event.user.ip_address
    }
    return event
  },
})
```

### `apps/web/sentry.server.config.ts`

```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.2 : 1.0,
  beforeSend(event) {
    if (event.user) {
      delete event.user.email
      delete event.user.username
    }
    // Drop request bodies — may contain template_props with PII
    if (event.request?.data) {
      delete event.request.data
    }
    return event
  },
})
```

### `apps/web/next.config.ts` — wrap with Sentry

```typescript
import { withSentryConfig } from "@sentry/nextjs"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // … existing config
}

export default withSentryConfig(nextConfig, {
  org:                     process.env.SENTRY_ORG,
  project:                 process.env.SENTRY_PROJECT,
  silent:                  !process.env.CI,
  widenClientFileUpload:   true,
  hideSourceMaps:          true,   // never ship source maps to browser
  disableLogger:           true,
  automaticVercelMonitors: true,   // cron job health monitoring in Sentry Crons
})
```

---

## 8. Suppression Logic

| Suppression reason | Scope (`category`) | Blocks transactional | Blocks marketing |
|---|---|---|---|
| `bounce` | `all` | ✅ yes | ✅ yes |
| `complaint` | `all` | ✅ yes | ✅ yes |
| `unsubscribe` | `marketing` | ❌ no | ✅ yes |
| `manual` | `all` | ✅ yes | ✅ yes |
| `invalid` | `all` | ✅ yes | ✅ yes |

Enforced in `sendClaimedEmailJob()` via `.in("category", ["all", job.category])` — fetches any suppression row that applies to this send's category before any Resend call.

> `delivery_delayed` is non-terminal. A job in that state can transition to `delivered`, `bounced`, or `complained`. The `sent_at` timestamp is preserved on the job row throughout.

---

## 9. Security Controls

| Risk | Control |
|---|---|
| Duplicate sends | DB `UNIQUE(idempotency_key)` + Resend provider idempotency key (256-char, 24-hr) |
| Queue race conditions | `FOR UPDATE SKIP LOCKED` inside `claim_email_jobs()` RPC |
| PII exposure via email_jobs | `REVOKE ALL` on table; no user-facing access in v1 |
| Webhook spoofing | `svix` library verifies signature on raw body |
| Webhook replay | `UNIQUE(provider, provider_event_id)` in `email_events` |
| Email abuse | Upstash rate limit: 10 enqueues/user/hour |
| Bounce reputation damage | Webhook auto-suppresses hard bounces and complaints |
| Sentry PII leak | `beforeSend` strips user fields + request body |
| Template XSS | React Email escapes by default; `dangerouslySetInnerHTML` never used |
| Secret exposure | `getSecret()` reads from `process.env`; never logged or returned to client |
| Cron abuse | Bearer token required (`CRON_SECRET`) |
| Marketing compliance | `List-Unsubscribe-Post` header on marketing category only |

---

## 10. Environment Variables

| Variable | Location | Source |
|---|---|---|
| `RESEND_API_KEY` | Vercel + `.env.local` | Resend dashboard → API Keys |
| `RESEND_WEBHOOK_SECRET` | Vercel only | Resend dashboard → Webhooks → Signing Secret |
| `CRON_SECRET` | Vercel only | Random 32-byte hex — protects cron drain endpoint (`openssl rand -hex 32`) |
| `UNSUBSCRIBE_SECRET` | Vercel only | Random 32-byte hex — signs unsubscribe tokens (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_SENTRY_DSN` | Vercel + `.env.local` | Sentry → Project → DSN |
| `SENTRY_AUTH_TOKEN` | Vercel only | Sentry → Settings → Auth Tokens |
| `SENTRY_ORG` | Vercel + `.env.local` | Sentry org slug |
| `SENTRY_PROJECT` | Vercel + `.env.local` | Sentry project slug |
| `NEXT_PUBLIC_VERCEL_ENV` | Auto-set by Vercel | `production` / `preview` / `development` |

Add to `turbo.json` → `tasks.build.env`:

```json
"RESEND_API_KEY",
"RESEND_WEBHOOK_SECRET",
"CRON_SECRET",
"UNSUBSCRIBE_SECRET",
"NEXT_PUBLIC_SENTRY_DSN",
"SENTRY_AUTH_TOKEN",
"SENTRY_ORG",
"SENTRY_PROJECT"
```

> Note: `RESEND_WEBHOOK_SECRET`, `CRON_SECRET`, and `UNSUBSCRIBE_SECRET` are runtime-only secrets. They must never be prefixed with `NEXT_PUBLIC_`.

---

## 11. `vercel.json` cron additions

```json
{
  "crons": [
    { "path": "/api/cron/email-verify",             "schedule": "30 6 * * 1"  },
    { "path": "/api/cron/email-verify?scope=stale", "schedule": "30 6 1 * *"  },
    { "path": "/api/cron/email-drain",              "schedule": "*/2 * * * *" }
  ]
}
```

> ⚠️ **Vercel Hobby** supports only **1 cron per day**. `*/2 * * * *` will **fail deployment**.
>
> **Vercel Pro is required for this design.** Hobby is not suitable for production email draining.
>
> On Hobby (development/testing only):
> - `"schedule": "0 0 * * *"` (once daily — not suitable for production latency targets)
> - Best-effort: call `drainEmailQueue()` synchronously at the end of `enqueueEmail()`, accepting that timeouts cause silent failures
> - Alternative: use [Upstash QStash](https://upstash.com/docs/qstash) as a hosted trigger instead of Vercel Cron

---

## 12. DNS Configuration (Resend domain verification)

In **Resend dashboard → Domains → Add `footycontacts.com`**:

1. **SPF** — `TXT @ "v=spf1 include:amazonses.com ~all"` (Resend delivers via SES)
2. **DKIM** — Add the two CNAME records Resend provides (auto-rotated)
3. **DMARC** — `TXT _dmarc "v=DMARC1; p=quarantine; rua=mailto:dmarc@footycontacts.com; pct=100"`

Without SPF/DKIM/DMARC alignment, deliverability will be poor and bulk/marketing mail is likely to be rejected, spam-foldered, or rate-limited by major inbox providers (Gmail, Yahoo, Outlook).
Test with [mail-tester.com](https://mail-tester.com) — target **10/10**.

---

## 13. User Flow Paths

### Happy path
```
Product event → enqueueEmail() → email_jobs (pending)
→ cron drain → claim_email_jobs() RPC → status: sending, locked_at set
→ suppression check (pass) → render HTML + text → Resend.send()
→ status: sent → webhook delivered → status: delivered
```

### Duplicate event
```
Same business event retried → same idempotency_key
→ upsert ignoreDuplicates → no second row → no second email
(Also: Resend provider idempotency key catches any slip-through)
```

### Suppressed address
```
sendClaimedEmailJob() → suppression check → found
→ status: cancelled, cancelled_at set, locked_at cleared
→ Resend never called
```

### Failed send
```
Resend error → handleSendFailure()
→ exponential backoff (2^attempt minutes)
→ status: pending, next_retry_at set, locked_at cleared
→ after max_attempts → status: failed → Sentry DLQ error alert
```

### Crashed worker (stuck lock)
```
Job stuck in 'sending' for > 5 min
→ next drain: requeue_stuck_email_jobs() → status: pending, locked_at cleared
→ claimed again on next batch
```

### Duplicate webhook
```
Resend retries delivery webhook
→ upsert on email_events with ignoreDuplicates
→ stored = null → return { received: true, duplicate: true }
→ no double status update
```

---

## 14. Implementation Order

```
Phase 0 — Audit (before any code)
  □ All required env vars identified and reachable via getSecret()
  □ All existing email flows in codebase listed
  □ Vercel plan confirmed (Pro required for */2 cron)
  □ Sending domain confirmed

Phase 1 — Database
  □ Migration: 20260514_email_queue.sql
  □ Migration: 20260514_email_queue_functions.sql
  □ Verify: anon/authenticated cannot SELECT email_jobs directly
  □ Verify: service role can INSERT and call RPCs
  □ Verify: duplicate idempotency_key is rejected (unique constraint)
  □ Verify: claim_email_jobs() atomicity (two concurrent calls, no overlap)

Phase 2 — Email library
  □ lib/email/client.ts
  □ lib/email/templates/index.ts (Zod schemas + category)
  □ lib/email/templates/_base.tsx
  □ lib/email/enqueue.ts
  □ lib/email/sender.ts
  □ lib/email/drain.ts
  □ lib/email/rate-limit.ts

Phase 3 — Sentry
  □ sentry.client.config.ts
  □ sentry.server.config.ts
  □ Wrap next.config.ts with withSentryConfig
  □ SENTRY_AUTH_TOKEN added to Vercel
  □ Source maps uploaded to Sentry and hidden from public client access (hideSourceMaps: true)

Phase 4 — API routes
  □ /api/cron/email-drain/route.ts   (runtime = "nodejs")
  □ /api/webhooks/resend/route.ts    (runtime = "nodejs")
  □ /api/email/unsubscribe/route.ts  (GET + POST, verifies HMAC-signed token)
  □ lib/email/unsubscribe.ts         (createUnsubscribeToken / verifyUnsubscribeToken)
  □ /unsubscribed/page.tsx confirmation UI implemented
  □ UNSUBSCRIBE_SECRET added to Vercel
  □ Cron added to apps/web/vercel.json
  □ Webhook URL registered in Resend dashboard

Phase 5 — Templates
  □ welcome.tsx (HTML + text/plain, Zod-validated props)
  □ export-ready.tsx
  □ unlock-confirmation.tsx
  □ npx email dev — visual check
  □ text/plain render verified

Phase 6 — DNS + Deliverability
  □ Domain verified in Resend
  □ SPF / DKIM / DMARC DNS records added
  □ mail-tester.com score ≥ 9/10

Phase 7 — Staged rollout
  □ Deploy migrations
  □ Deploy code behind EMAIL_QUEUE_ENABLED=false
  □ Test enqueue in staging
  □ Test drain manually
  □ Test Resend webhook via Resend dashboard → Test event
  □ Enable welcome email first — monitor for 24 h
  □ Enable remaining templates
  □ Remove any old direct-send code paths
```

---

## 15. A+ Quality Bar

```
□ Emails never sent directly from user-facing actions
□ Every email has a stable business idempotency key
□ Resend provider idempotency key set on every send call
□ Queue claiming is atomic with FOR UPDATE SKIP LOCKED
□ Suppressed emails cancelled before provider send
□ Suppression is category-aware (unsubscribe ≠ bounce)
□ Webhooks verified via Svix library on raw body
□ Webhook events stored idempotently in email_events
□ Users cannot SELECT template_props (REVOKE ALL on table)
□ No user-facing email job access in v1; future status view must use SECURITY INVOKER + explicit RLS
□ Failed jobs retry with exponential backoff
□ Exhausted jobs → status: failed + Sentry DLQ error
□ Bounce/complaint auto-suppresses via webhook
□ Templates render HTML and text/plain
□ Template props validated with Zod before enqueue
□ Cron route protected by CRON_SECRET bearer token
□ Stuck jobs recovered on next drain run (locked_at)
□ DNS SPF/DKIM/DMARC verified (mail-tester ≥ 9/10)
□ Sentry beforeSend strips email addresses + request bodies
□ Vercel plan confirmed before deploying frequent cron (Pro required for */2)
□ Old direct-send code removed after rollout
□ Webhook uses svix-id header as provider_event_id (not email_id)
□ Webhook status transitions guarded with .in("status", [...])
□ Template props re-validated with Zod at send time (schema.parse in sender.ts)
□ No `as never` casts in template rendering path
□ ClaimedEmailJob type exported from sender.ts; drain.ts casts RPC result to it
□ Unsubscribe route verifies HMAC-signed token (UNSUBSCRIBE_SECRET)
□ GET /unsubscribe redirects to confirmation page only; POST performs the actual unsubscribe
□ Unsubscribe URL includes explicit category= param (not relying on route defaults)
□ SECURITY DEFINER functions REVOKE'd from PUBLIC, anon, authenticated; GRANT'd to service_role only
□ SET search_path = public, pg_temp on all SECURITY DEFINER functions
□ email_dlq REVOKE'd from anon, authenticated
□ email_suppressions has category column — UNIQUE(email, category, reason)
□ Email normalisation triggers enforce lowercase before CHECK constraints run
□ template_props size guard (< 8192 bytes) in place
□ retry_failed_email_job() admin function available for DLQ recovery
```

---

## 16. Monitoring Targets

| Metric | Target | Alert threshold |
|---|---|---|
| Queue-to-sent latency | < 5 min | > 15 min → Sentry warning |
| DLQ depth | 0 | > 0 → Sentry error |
| Bounce rate | < 2% | > 5% → Sentry error |
| Complaint rate | ~0% | > 0.1% → Sentry error |
| Cron success | 100% | Any repeated miss → Sentry Crons alert |
| Webhook signature failures | 0 | > 5/hour → Sentry error |
| Stuck jobs requeued | 0 | > 0 → Sentry warning |

