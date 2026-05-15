-- ============================================================
-- Campaign Enrollments
-- Tracks which reactivation sequence each user is enrolled in.
-- Used to prevent duplicate sends and to cancel pending emails
-- when a user converts to a paid subscriber.
-- ============================================================

CREATE TABLE public.campaign_enrollments (
  id           uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign     text         NOT NULL,
  status       text         NOT NULL DEFAULT 'active',
  enrolled_at  timestamptz  NOT NULL DEFAULT now(),
  completed_at timestamptz,

  UNIQUE (user_id, campaign),
  CONSTRAINT campaign_enrollments_status_valid
    CHECK (status IN ('active', 'completed', 'converted', 'unsubscribed'))
);

CREATE INDEX idx_campaign_enrollments_user_campaign
  ON public.campaign_enrollments (user_id, campaign);

-- RLS: only the service role (admin API) can read/write
ALTER TABLE public.campaign_enrollments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.campaign_enrollments FROM anon, authenticated;
GRANT  ALL ON public.campaign_enrollments TO service_role;

-- ── Cancel pending campaign emails when a user subscribes ───────────────────
-- When a subscription row transitions to status='active', cancel any pending
-- reactivation email_jobs for that user and mark the enrollment as converted.
CREATE OR REPLACE FUNCTION public.cancel_campaign_emails_on_conversion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'active'
     AND (OLD.status IS NULL OR OLD.status <> 'active')
  THEN
    -- Cancel pending reactivation email jobs
    UPDATE public.email_jobs
    SET
      status       = 'cancelled',
      cancelled_at = now(),
      updated_at   = now()
    WHERE user_id     = NEW.user_id
      AND status      = 'pending'
      AND template_id LIKE 'reactivation-%';

    -- Mark campaign enrollment as converted
    UPDATE public.campaign_enrollments
    SET
      status       = 'converted',
      completed_at = now()
    WHERE user_id  = NEW.user_id
      AND campaign = 'reactivation-2026'
      AND status   = 'active';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cancel_campaign_emails_on_conversion()
  FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.cancel_campaign_emails_on_conversion()
  TO service_role;

CREATE TRIGGER trg_cancel_campaign_emails_on_conversion
  AFTER INSERT OR UPDATE OF status ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.cancel_campaign_emails_on_conversion();
