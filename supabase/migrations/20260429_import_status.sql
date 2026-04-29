-- Add import_status to contacts — separates "exists in DB" from "visible" from "email quality"
-- States: draft (awaiting verification), imported (verified/accepted), rejected (invalid/suppressed)

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS import_status text NOT NULL DEFAULT 'imported';

ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_import_status_check
  CHECK (import_status IN ('draft', 'imported', 'rejected'));

-- Backfill: contacts that are already suppressed → rejected
UPDATE public.contacts
  SET import_status = 'rejected'
  WHERE suppression_status = 'suppressed';

-- Contacts that are hidden/archived but active stay as 'imported'
-- (they were imported before this feature was added)

-- Ensure the index used by email-verify cron includes import_status for efficient draft queries
CREATE INDEX IF NOT EXISTS contacts_import_status_idx ON public.contacts (import_status)
  WHERE import_status = 'draft';
