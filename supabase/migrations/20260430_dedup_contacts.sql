    -- Index to make FK cascade on csv_import_rows fast during contact deletes
CREATE INDEX IF NOT EXISTS idx_csv_import_rows_contact_id
  ON public.csv_import_rows (contact_id);

-- Deduplicate contacts
-- Email dupes: keep published > most complete data > oldest created_at
-- No-email dupes: keep by name+org with same priority
DO $$
DECLARE
  batch_size    INT := 2000;
  deleted_total INT := 0;
  deleted_batch INT;
BEGIN
  -- PASS 1: Email duplicates
  LOOP
    WITH ranked AS (
      SELECT id,
        ROW_NUMBER() OVER (
          PARTITION BY lower(trim(email))
          ORDER BY
            CASE visibility_status WHEN 'published' THEN 0 ELSE 1 END,
            (CASE WHEN phone        IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN linkedin_url IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN organisation IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN country      IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN role         IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN category     IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN city         IS NOT NULL THEN 1 ELSE 0 END) DESC,
            created_at ASC
        ) AS rn
      FROM contacts
      WHERE email IS NOT NULL
    ),
    to_delete AS (
      SELECT id FROM ranked WHERE rn > 1 LIMIT batch_size
    )
    DELETE FROM contacts WHERE id IN (SELECT id FROM to_delete);

    GET DIAGNOSTICS deleted_batch = ROW_COUNT;
    deleted_total := deleted_total + deleted_batch;
    EXIT WHEN deleted_batch = 0;
  END LOOP;

  RAISE NOTICE 'Email dedup: deleted % rows', deleted_total;
  deleted_total := 0;

  -- PASS 2: No-email name+org duplicates
  LOOP
    WITH ranked AS (
      SELECT id,
        ROW_NUMBER() OVER (
          PARTITION BY lower(trim(name)), lower(trim(coalesce(organisation,'')))
          ORDER BY
            CASE visibility_status WHEN 'published' THEN 0 ELSE 1 END,
            (CASE WHEN phone        IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN linkedin_url IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN country      IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN role         IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN category     IS NOT NULL THEN 1 ELSE 0 END +
             CASE WHEN city         IS NOT NULL THEN 1 ELSE 0 END) DESC,
            created_at ASC
        ) AS rn
      FROM contacts
      WHERE email IS NULL
    ),
    to_delete AS (
      SELECT id FROM ranked WHERE rn > 1 LIMIT batch_size
    )
    DELETE FROM contacts WHERE id IN (SELECT id FROM to_delete);

    GET DIAGNOSTICS deleted_batch = ROW_COUNT;
    deleted_total := deleted_total + deleted_batch;
    EXIT WHEN deleted_batch = 0;
  END LOOP;

  RAISE NOTICE 'Name+org dedup: deleted % rows', deleted_total;
END $$;
