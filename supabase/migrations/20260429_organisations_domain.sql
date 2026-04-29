-- Add domain column to organisations.
-- logo_url remains as an admin-uploaded override slot only.
-- Automatic logos are derived from domain at render time using Google's favicon CDN.

ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS domain text;

UPDATE public.organisations
SET domain = REGEXP_REPLACE(
  REGEXP_REPLACE(website, '^https?://(www\.)?', ''),
  '/.*$', ''
)
WHERE website IS NOT NULL AND domain IS NULL;

-- Clear any programmatically-set Clearbit URLs that may exist from a prior migration
UPDATE public.organisations
SET logo_url = NULL
WHERE logo_url LIKE 'https://logo.clearbit.com/%';

CREATE UNIQUE INDEX IF NOT EXISTS organisations_domain_idx
  ON public.organisations (domain)
  WHERE domain IS NOT NULL;
