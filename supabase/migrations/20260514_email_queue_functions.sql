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
