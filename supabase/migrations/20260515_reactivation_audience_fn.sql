-- ============================================================
-- Helper function: returns all users eligible for the
-- reactivation-2026 campaign.
--
-- Eligible = email confirmed, not suppressed (all/marketing),
--            no active subscription, not yet enrolled,
--            not a role-based/disposable address.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_reactivation_audience()
RETURNS TABLE (
  id         uuid,
  email      text,
  full_name  text,
  first_name text
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, auth, pg_temp
AS $$
  SELECT
    u.id,
    u.email::text,
    p.full_name,
    p.first_name
  FROM auth.users u
  LEFT JOIN public.profiles p              ON p.id       = u.id
  LEFT JOIN public.subscriptions s         ON s.user_id  = u.id AND s.status = 'active'
  LEFT JOIN public.campaign_enrollments ce ON ce.user_id = u.id AND ce.campaign = 'reactivation-2026'
  WHERE
    u.is_anonymous      = false
    AND u.deleted_at    IS NULL
    AND u.email_confirmed_at IS NOT NULL
    AND s.user_id       IS NULL   -- no active subscription
    AND ce.user_id      IS NULL   -- not yet enrolled
    AND u.email NOT IN (
      SELECT es.email
      FROM public.email_suppressions es
      WHERE es.category IN ('all', 'marketing')
    )
    AND NOT (
      u.email ILIKE 'admin@%'
      OR u.email ILIKE 'support@%'
      OR u.email ILIKE 'info@%'
      OR u.email ILIKE 'noreply@%'
      OR u.email ILIKE 'no-reply@%'
    )
  ORDER BY u.created_at ASC;
$$;

REVOKE EXECUTE ON FUNCTION public.get_reactivation_audience()
  FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.get_reactivation_audience()
  TO service_role;
