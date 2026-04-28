-- ============================================================
-- Migration: Duplicate detection & email suppression
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Email suppression blacklist
--    Emails here are never imported; populated by Reoon invalid results and manual entries.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_suppressions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text        UNIQUE NOT NULL,
  reason      text        NOT NULL DEFAULT 'manual',
  -- 'manual' | 'reoon_invalid' | 'reoon_risky' | 'bounce' | 'spam_trap'
  added_at    timestamptz NOT NULL DEFAULT now(),
  added_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_suppressions_admin_only" ON public.email_suppressions
  FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE INDEX IF NOT EXISTS email_suppressions_email_idx ON public.email_suppressions(email);


-- 2. Contact role/organisation history
--    A row is inserted (with the OLD values) whenever role or organisation changes during import.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_role_history (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id   uuid        NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  role         text,
  organisation text,
  recorded_at  timestamptz NOT NULL DEFAULT now(),
  source       text        NOT NULL DEFAULT 'csv_import',
  -- 'csv_import' | 'manual'
  import_id    uuid        REFERENCES public.csv_imports(id) ON DELETE SET NULL
);

ALTER TABLE public.contact_role_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_role_history_admin_only" ON public.contact_role_history
  FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE INDEX IF NOT EXISTS contact_role_history_contact_id_idx ON public.contact_role_history(contact_id);
CREATE INDEX IF NOT EXISTS contact_role_history_recorded_at_idx ON public.contact_role_history(recorded_at DESC);


-- 3. Add import_mode, suppressed_rows, updated_rows to csv_imports
-- ------------------------------------------------------------
ALTER TABLE public.csv_imports
  ADD COLUMN IF NOT EXISTS import_mode     text    NOT NULL DEFAULT 'skip',
  -- 'skip'   = skip duplicates entirely (safe, no data loss)
  -- 'update' = update mutable fields on matched contacts, log role history
  ADD COLUMN IF NOT EXISTS suppressed_rows integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_rows    integer DEFAULT 0;


-- 4. Partial unique index on linkedin_url (new contacts only — does not enforce on existing dupes)
--    Prevents future inserts of the same LinkedIn URL.
--    NOTE: if existing data has duplicate linkedin_urls, clean them first:
--      SELECT linkedin_url, COUNT(*) FROM contacts WHERE linkedin_url IS NOT NULL GROUP BY linkedin_url HAVING COUNT(*) > 1;
-- ------------------------------------------------------------
-- CREATE UNIQUE INDEX IF NOT EXISTS contacts_linkedin_url_unique_idx
--   ON public.contacts(linkedin_url)
--   WHERE linkedin_url IS NOT NULL AND linkedin_url != '';
-- (Commented out — uncomment after verifying no existing dupes)


-- 5. Ensure reoon_api_key is in Vault with the correct lowercase name.
--    If you stored it as REOON_API_KEY, run this to add the lowercase alias:
--
--   SELECT vault.create_secret(
--     (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'REOON_API_KEY' LIMIT 1),
--     'reoon_api_key',
--     'Reoon email verification API key'
--   );
--
--   Or if adding fresh:
--   SELECT vault.create_secret('YOUR_REOON_API_KEY_VALUE', 'reoon_api_key', 'Reoon email verification API key');
