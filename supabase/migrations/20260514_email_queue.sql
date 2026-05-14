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
