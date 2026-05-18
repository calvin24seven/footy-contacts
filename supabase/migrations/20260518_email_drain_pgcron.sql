-- ============================================================
-- Replace Vercel Cron email drain trigger with pg_cron + pg_net.
--
-- Motivation: Vercel Hobby limits cron to once per day. pg_cron has
-- no such limit and runs entirely within Supabase.
--
-- What this does:
--   1. Enables pg_net (HTTP from Postgres)
--   2. Schedules pg_cron to POST to /api/cron/email-drain every 5 minutes,
--      reading CRON_SECRET from Supabase Vault at call time.
--
-- Pre-requisite (one-time manual step — do this BEFORE applying migration):
--   Run the following in the Supabase SQL editor, substituting your actual
--   CRON_SECRET value (must match CRON_SECRET in Vercel environment variables):
--
--     SELECT vault.create_secret('your-cron-secret-here', 'cron_secret');
--
--   Verify it was stored:
--     SELECT name FROM vault.secrets WHERE name = 'cron_secret';
--
-- After applying this migration, remove the email-drain entry from
-- apps/web/vercel.json to prevent double-draining.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_net;

-- Safely remove any existing version of this job
DO $$
BEGIN
  PERFORM cron.unschedule('email-drain');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'email-drain',
  '*/5 * * * *',
  $$
  SELECT net.http_get(
    url     := 'https://footycontacts.com/api/cron/email-drain',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'cron_secret'
        LIMIT 1
      )
    )
  );
  $$
);
