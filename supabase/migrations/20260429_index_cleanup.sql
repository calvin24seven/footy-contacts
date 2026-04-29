-- Drop 4 confirmed identical duplicate indexes
-- Each pair had identical definitions; keeping the idx_-prefixed canonical versions
DROP INDEX IF EXISTS public.contacts_name_trgm_idx;          -- dup of idx_contacts_name_trgm
DROP INDEX IF EXISTS public.contacts_organisation_trgm_idx;  -- dup of idx_contacts_organisation_trgm
DROP INDEX IF EXISTS public.contacts_role_category_idx;      -- dup of idx_contacts_role_category
DROP INDEX IF EXISTS public.contacts_verified_status_idx;    -- dup of idx_contacts_verified_status

-- Partial covering index for COUNT(*) on the base unfiltered query
-- Allows Postgres to count published+active contacts via index-only scan at any scale
-- (Note: planner may prefer idx_contacts_last_verified_at which already covers this path)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_published_active_count
  ON public.contacts (id)
  WHERE visibility_status = 'published' AND suppression_status = 'active';
