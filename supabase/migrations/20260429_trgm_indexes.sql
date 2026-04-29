-- pg_trgm GIN indexes for fast ilike '%term%' full-text search.
-- Without these, every search is a sequential scan on the full contacts table.
-- With GIN trigram indexes, ilike '%term%' uses the index → ~30–60ms.
-- NOTE: These indexes already exist on the live DB from a prior migration.
-- This file documents them for reproducibility on fresh environments.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_contacts_name_trgm
  ON public.contacts USING gin (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_contacts_organisation_trgm
  ON public.contacts USING gin (organisation gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_contacts_role_trgm
  ON public.contacts USING gin (role gin_trgm_ops);
