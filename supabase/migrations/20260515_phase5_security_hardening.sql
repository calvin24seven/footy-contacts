-- ============================================================
-- Phase 5 Security Hardening
-- 1. Column-level privileges on contacts (protect PII)
-- 2. Fix mutable search_path on trigger functions
-- ============================================================

-- ── 1. Column-level security on public.contacts ─────────────────────────────
-- Problem: authenticated users can query the contacts table directly via
-- PostgREST and retrieve gated PII fields (email, phone, linkedin_url, etc.)
-- without ever unlocking a contact — bypassing application-layer controls.
--
-- Fix: revoke full-table SELECT from authenticated and re-grant only the
-- columns that are appropriate for pre-unlock discovery.
-- Sensitive fields remain accessible ONLY via:
--   • get_contact_for_user() RPC (SECURITY DEFINER — checks unlock status)
--   • service_role admin client (bypasses column privileges by design)
REVOKE SELECT ON public.contacts FROM authenticated;

GRANT SELECT (
  id, name, organisation, role, category, role_category,
  country, city, region, level,
  verified_status, last_verified_at,
  has_email, has_phone, has_linkedin,
  visibility_status, suppression_status,
  created_at, updated_at, organisation_id
) ON public.contacts TO authenticated;

-- ── 2. Fix mutable search_path on trigger functions (WARN advisors) ──────────
-- Functions without a fixed search_path can be exploited via schema injection
-- if a privileged session manipulates search_path before the trigger fires.
CREATE OR REPLACE FUNCTION app_auth.check_email_exists()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
  SET search_path = public, app_auth
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM auth.users
    WHERE lower(email) = lower(NEW.email) AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Email already exists: %', NEW.email;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_email_to_lower()
  RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN NEW.to_email = lower(trim(NEW.to_email)); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_suppression_email()
  RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN NEW.email = lower(trim(NEW.email)); RETURN NEW; END;
$$;

CREATE OR REPLACE FUNCTION public.set_email_jobs_updated_at()
  RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
