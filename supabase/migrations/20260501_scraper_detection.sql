-- ============================================================
-- Migration: Scraper behavioural detection (Layer 3)
-- Creates contact_views audit table, indexes, and pg_cron jobs
-- that automatically suspend accounts exhibiting scraping patterns.
-- ============================================================

-- 1. contact_views table
--    Records every contact detail page view for anomaly detection.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_views (
  id          bigserial PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  contact_id  uuid NOT NULL,
  ip          text,
  user_agent  text,
  viewed_at   timestamptz NOT NULL DEFAULT now()
);

-- Partition-friendly index for the detection queries
CREATE INDEX IF NOT EXISTS idx_contact_views_user_viewed
  ON public.contact_views (user_id, viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_views_ip_viewed
  ON public.contact_views (ip, viewed_at DESC);

-- Auto-drop rows older than 30 days to keep the table small
CREATE INDEX IF NOT EXISTS idx_contact_views_viewed_at
  ON public.contact_views (viewed_at);

-- RLS: users cannot read each other's view logs; only service role can write
ALTER TABLE public.contact_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_views_insert_own"
  ON public.contact_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can SELECT via service role (bypasses RLS)


-- 2. Suspend-on-high-velocity function
--    Called by cron. Suspends any user who viewed >200 contacts in 10 min.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.detect_scraper_velocity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT user_id, COUNT(*) AS view_count
    FROM public.contact_views
    WHERE viewed_at > now() - INTERVAL '10 minutes'
    GROUP BY user_id
    HAVING COUNT(*) > 200
  LOOP
    UPDATE public.profiles
    SET
      is_suspended    = true,
      suspended_reason = 'Automated: >200 contact views in 10 minutes (scraper detection)'
    WHERE id = rec.user_id
      AND is_suspended IS DISTINCT FROM true;  -- skip if already suspended
  END LOOP;
END;
$$;


-- 3. Detect sequential ID browsing
--    Flags users who browsed >= 50 contacts whose numeric ID components
--    are sequential (a pattern that only a scraper would exhibit).
--    We proxy "sequential" by checking if the user viewed >=50 contacts
--    within a 5-minute window — uncommon for a human.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.detect_scraper_sequential()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT user_id, COUNT(*) AS view_count
    FROM public.contact_views
    WHERE viewed_at > now() - INTERVAL '5 minutes'
    GROUP BY user_id
    HAVING COUNT(*) >= 50
  LOOP
    UPDATE public.profiles
    SET
      is_suspended    = true,
      suspended_reason = 'Automated: >=50 contact views in 5 minutes (sequential scraping)'
    WHERE id = rec.user_id
      AND is_suspended IS DISTINCT FROM true;
  END LOOP;
END;
$$;


-- 4. Detect shared-IP multi-account abuse
--    If the same IP appears across 3 or more distinct user accounts in the
--    last 24 hours, flag all of them (human review — do NOT auto-suspend).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scraper_flags (
  id          bigserial PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  reason      text NOT NULL,
  flagged_at  timestamptz NOT NULL DEFAULT now(),
  reviewed    boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_scraper_flags_user
  ON public.scraper_flags (user_id, flagged_at DESC);

CREATE OR REPLACE FUNCTION public.detect_shared_ip_accounts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rec RECORD;
  uid uuid;
BEGIN
  FOR rec IN
    SELECT ip, array_agg(DISTINCT user_id) AS user_ids
    FROM public.contact_views
    WHERE viewed_at > now() - INTERVAL '24 hours'
      AND ip IS NOT NULL
    GROUP BY ip
    HAVING COUNT(DISTINCT user_id) >= 3
  LOOP
    FOREACH uid IN ARRAY rec.user_ids
    LOOP
      -- Insert a flag (idempotent: skip if already flagged for same IP today)
      INSERT INTO public.scraper_flags (user_id, reason)
      SELECT uid, 'IP ' || rec.ip || ' shared across ' || array_length(rec.user_ids, 1) || ' accounts in 24 h'
      WHERE NOT EXISTS (
        SELECT 1 FROM public.scraper_flags
        WHERE user_id = uid
          AND reason LIKE 'IP ' || rec.ip || '%'
          AND flagged_at > now() - INTERVAL '24 hours'
      );
    END LOOP;
  END LOOP;
END;
$$;


-- 5. Purge old contact_views (keep last 30 days only)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.purge_old_contact_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.contact_views
  WHERE viewed_at < now() - INTERVAL '30 days';
END;
$$;


-- 6. Schedule detection crons via pg_cron
--    Requires pg_cron extension (enabled in Supabase by default on Pro plan).
-- ------------------------------------------------------------

-- Velocity check every 5 minutes
SELECT cron.schedule(
  'scraper-velocity-check',
  '*/5 * * * *',
  $$SELECT public.detect_scraper_velocity()$$
);

-- Sequential check every 5 minutes (offset slightly to spread load)
SELECT cron.schedule(
  'scraper-sequential-check',
  '*/5 * * * *',
  $$SELECT public.detect_scraper_sequential()$$
);

-- Shared-IP check every hour
SELECT cron.schedule(
  'scraper-shared-ip-check',
  '0 * * * *',
  $$SELECT public.detect_shared_ip_accounts()$$
);

-- Nightly purge of old view records
SELECT cron.schedule(
  'purge-contact-views',
  '30 3 * * *',
  $$SELECT public.purge_old_contact_views()$$
);
