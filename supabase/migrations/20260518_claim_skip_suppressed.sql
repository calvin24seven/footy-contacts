-- ============================================================
-- Fix: claim_email_jobs skips suppressed email addresses
-- ============================================================
-- Bug: bounced addresses are suppressed via the Resend webhook,
-- but their remaining pending jobs (emails 2-5) would still be
-- claimed and sent — causing repeat bounces.
-- Fix: add NOT EXISTS check against email_suppressions.
-- Also: retroactively cancel any pending jobs for already-suppressed
-- addresses that built up before this fix was deployed.
-- ============================================================

-- 1. Replace claim_email_jobs with suppression-aware version
CREATE OR REPLACE FUNCTION public.claim_email_jobs(batch_size integer)
RETURNS SETOF public.email_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  WITH claimed AS (
    SELECT ej.id
    FROM public.email_jobs ej
    WHERE ej.status = 'pending'
      AND (ej.next_retry_at IS NULL OR ej.next_retry_at <= now())
      -- Skip addresses suppressed globally (category='all') or for this category
      AND NOT EXISTS (
        SELECT 1
        FROM public.email_suppressions es
        WHERE es.email    = ej.to_email
          AND es.category IN ('all', ej.category)
      )
    ORDER BY ej.created_at ASC
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

-- Execution restricted to service role (inherited from original migration)
REVOKE EXECUTE ON FUNCTION public.claim_email_jobs(integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.claim_email_jobs(integer) TO   service_role;

-- 2. Retroactively cancel pending jobs for already-suppressed addresses
UPDATE public.email_jobs
SET
  status     = 'bounced',
  last_error = 'Cancelled: address in suppression list',
  updated_at = now()
WHERE status = 'pending'
  AND EXISTS (
    SELECT 1
    FROM public.email_suppressions es
    WHERE es.email    = email_jobs.to_email
      AND es.category IN ('all', email_jobs.category)
  );
