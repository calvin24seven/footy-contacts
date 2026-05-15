-- Migration: add preferred_region to profiles
-- Used by the onboarding StepWhere (Step 3) to store the region the user
-- selected (one of 8 pre-defined regions or null).
-- Referenced by generateSuggestedSearches() to personalise search chips.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_region TEXT;

COMMENT ON COLUMN public.profiles.preferred_region IS
  'Region selected during onboarding Step 3 (e.g. "United Kingdom", "Africa"). '
  'Used to pre-populate country filter on the dashboard search page.';
