-- ============================================================
-- Migration: Contact health dashboard, cron queuing, richer verified_status
-- Depends on: 20260428_dedup_suppressions.sql (run that first)
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Richer verified_status constraint
--    Adds catch_all | unknown | risky alongside the existing verified | unverified.
--    Safe to run multiple times (DROP IF EXISTS + ADD).
-- ------------------------------------------------------------
ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_verified_status_check;
ALTER TABLE public.contacts ADD CONSTRAINT contacts_verified_status_check
  CHECK (verified_status IN ('verified', 'catch_all', 'unknown', 'risky', 'unverified'));


-- 2. Cron queuing timestamp
--    Set by the weekly cron job when a contact is submitted to Reoon.
--    Prevents the same new contacts being re-submitted on the next run before results are back.
-- ------------------------------------------------------------
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS cron_queued_at timestamptz;


-- 3. Track duplicate-skipped count on imports
--    Complements existing: successful_rows, updated_rows, failed_rows, suppressed_rows
-- ------------------------------------------------------------
ALTER TABLE public.csv_imports
  ADD COLUMN IF NOT EXISTS skipped_rows integer DEFAULT 0;


-- 4. Performance indexes
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_contacts_verified_status
  ON public.contacts (verified_status);

-- Partial index for the weekly cron: only unverified contacts that haven't been queued
CREATE INDEX IF NOT EXISTS idx_contacts_new_for_cron
  ON public.contacts (created_at)
  WHERE verified_status = 'unverified'
    AND email IS NOT NULL
    AND cron_queued_at IS NULL;

-- Partial index for the monthly re-verify cron
CREATE INDEX IF NOT EXISTS idx_contacts_stale_for_cron
  ON public.contacts (last_verified_at)
  WHERE verified_status IN ('catch_all', 'unknown')
    AND email IS NOT NULL;
