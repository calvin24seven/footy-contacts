-- ── 1. Denormalised contact_count on organisations ────────────────────────────

ALTER TABLE public.organisations
  ADD COLUMN IF NOT EXISTS contact_count integer NOT NULL DEFAULT 0;

-- Backfill current counts
UPDATE public.organisations o
SET contact_count = (
  SELECT COUNT(*)
  FROM public.contacts c
  WHERE c.organisation_id = o.id
    AND c.visibility_status   = 'published'
    AND c.suppression_status  = 'active'
    AND c.is_honeypot         = false
);

-- Trigger function: re-count affected org on contacts INSERT / UPDATE / DELETE
CREATE OR REPLACE FUNCTION public.refresh_org_contact_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_org_id uuid;
BEGIN
  target_org_id := COALESCE(
    NULLIF(NEW.organisation_id, OLD.organisation_id),
    NEW.organisation_id,
    OLD.organisation_id
  );

  -- If org changed, refresh the old org first
  IF TG_OP = 'UPDATE' AND OLD.organisation_id IS DISTINCT FROM NEW.organisation_id THEN
    UPDATE public.organisations
    SET contact_count = (
      SELECT COUNT(*) FROM public.contacts
      WHERE organisation_id  = OLD.organisation_id
        AND visibility_status  = 'published'
        AND suppression_status = 'active'
        AND is_honeypot        = false
    )
    WHERE id = OLD.organisation_id;
  END IF;

  IF target_org_id IS NOT NULL THEN
    UPDATE public.organisations
    SET contact_count = (
      SELECT COUNT(*) FROM public.contacts
      WHERE organisation_id  = target_org_id
        AND visibility_status  = 'published'
        AND suppression_status = 'active'
        AND is_honeypot        = false
    )
    WHERE id = target_org_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_refresh_org_contact_count ON public.contacts;
CREATE TRIGGER trg_refresh_org_contact_count
  AFTER INSERT OR UPDATE OF organisation_id, visibility_status, suppression_status, is_honeypot
  OR DELETE
  ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_org_contact_count();

-- Index for the generateStaticParams top-1000 query
CREATE INDEX IF NOT EXISTS idx_organisations_contact_count_desc
  ON public.organisations (contact_count DESC)
  WHERE slug IS NOT NULL;

-- ── 2. Materialized view: category × country stats ───────────────────────────

CREATE MATERIALIZED VIEW IF NOT EXISTS public.seo_category_country_stats AS
SELECT
  role_category                                            AS category,
  country,
  COUNT(*)                                                 AS contact_count,
  COUNT(*) FILTER (WHERE has_email = true)                 AS email_count,
  COUNT(DISTINCT organisation_id)                          AS org_count
FROM public.contacts
WHERE visibility_status   = 'published'
  AND suppression_status  = 'active'
  AND is_honeypot         = false
  AND role_category       IS NOT NULL
  AND country             IS NOT NULL
GROUP BY role_category, country;

CREATE UNIQUE INDEX IF NOT EXISTS idx_seo_cat_country_unique
  ON public.seo_category_country_stats (category, country);

CREATE INDEX IF NOT EXISTS idx_seo_cat_country_category
  ON public.seo_category_country_stats (category);

CREATE INDEX IF NOT EXISTS idx_seo_cat_country_country
  ON public.seo_category_country_stats (country);

-- Grant read access for the marketing anon client
GRANT SELECT ON public.seo_category_country_stats TO anon, authenticated;

-- ── 3. pg_cron: refresh matview daily at 03:00 UTC ───────────────────────────

SELECT cron.schedule(
  'refresh-seo-category-country-stats',
  '0 3 * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY public.seo_category_country_stats$$
);
