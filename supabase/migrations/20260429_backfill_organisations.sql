-- Backfill organisations table from contacts.organisation text field,
-- link every contact back via organisation_id, and set logo_url from Clearbit CDN.
--
-- Safe to re-run (ON CONFLICT DO NOTHING / WHERE organisation_id IS NULL).

-- ── 1. Populate organisations from unique contact org names ──────────────────
-- For each normalised_name group, pick the (org_name, website) pair with the
-- highest contact count — i.e. the most canonical / most-seen version wins.

-- normalised_name is a generated column: lower(trim(name)) — do NOT insert into it.
-- Most-frequent (organisation, website) pair per normalised group wins.
-- domain is extracted from website; logo_url is NULL (derived at render time via Google favicons).
INSERT INTO organisations (name, website, domain)
SELECT DISTINCT ON (norm_name)
  organisation AS name,
  website,
  REGEXP_REPLACE(
    REGEXP_REPLACE(website, '^https?://(www\.)?', ''),
    '/.*$', ''
  ) AS domain
FROM (
  SELECT
    organisation,
    website,
    LOWER(TRIM(organisation)) AS norm_name,
    COUNT(*) AS c
  FROM contacts
  WHERE organisation IS NOT NULL
  GROUP BY organisation, website
) ranked
ORDER BY norm_name, c DESC
ON CONFLICT (normalised_name) DO NOTHING;

-- ── 2. Link contacts → organisations via organisation_id ─────────────────────

UPDATE contacts c
SET organisation_id = o.id
FROM organisations o
WHERE LOWER(TRIM(c.organisation)) = o.normalised_name
  AND c.organisation IS NOT NULL
  AND c.organisation_id IS NULL;

-- ── 3. Verification counts ────────────────────────────────────────────────────
-- Run manually to confirm: SELECT COUNT(*) FROM organisations;
-- SELECT COUNT(*) FROM contacts WHERE organisation_id IS NOT NULL;
