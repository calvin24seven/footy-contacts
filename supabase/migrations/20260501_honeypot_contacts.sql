-- ============================================================
-- Migration: Honeypot contacts (Layer 4 scraper detection)
-- Adds is_honeypot flag to contacts and seeds 20 fake contacts.
-- Scrapers that unlock/export honeypot contacts reveal themselves.
-- ============================================================

-- 1. Add is_honeypot column
-- ------------------------------------------------------------
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS is_honeypot boolean NOT NULL DEFAULT false;

-- Fast lookup: partial index since honeypots are rare
CREATE INDEX IF NOT EXISTS idx_contacts_honeypot
  ON public.contacts (id)
  WHERE is_honeypot = true;


-- 2. Seed 20 honeypot contacts
--    Each has a unique trackable email domain so any outbound email
--    to these addresses can be traced back to the account that exported them.
--    They are realistic enough to fool a scraper but have no real person behind them.
-- ------------------------------------------------------------
INSERT INTO public.contacts (
  name, role, organisation, email, phone,
  city, country, level, category, region,
  website, linkedin_url,
  visibility_status, verified_status,
  is_honeypot
) VALUES
  ('James Harrington',  'Head of Recruitment',       'FC Bridgewater',       'j.harrington@trap-001.footycontacts.io',  NULL, 'Manchester',  'England',    'Professional', 'Football', 'Europe', 'https://fcbridgewater.example', NULL, 'published', 'unverified', true),
  ('Sophie Castellan',  'Technical Director',        'Eastbrook Athletic',   's.castellan@trap-002.footycontacts.io',   NULL, 'Birmingham',  'England',    'Professional', 'Football', 'Europe', NULL, NULL, 'published', 'unverified', true),
  ('Marco Delgado',     'Chief Scout',               'Riviera FC',           'm.delgado@trap-003.footycontacts.io',     NULL, 'Nice',        'France',     'Professional', 'Football', 'Europe', NULL, NULL, 'published', 'unverified', true),
  ('Lena Brandt',       'Performance Analyst',       'Wolfsberg United',     'l.brandt@trap-004.footycontacts.io',      NULL, 'Vienna',      'Austria',    'Professional', 'Football', 'Europe', NULL, NULL, 'published', 'unverified', true),
  ('Carlos Figueiredo', 'Sporting Director',         'União de Lisboa',      'c.figueiredo@trap-005.footycontacts.io',  NULL, 'Lisbon',      'Portugal',   'Professional', 'Football', 'Europe', NULL, NULL, 'published', 'unverified', true),
  ('Mia Johansson',     'Head of Women''s Football', 'Norra IK',             'm.johansson@trap-006.footycontacts.io',   NULL, 'Stockholm',   'Sweden',     'Semi-Pro',     'Football', 'Europe', NULL, NULL, 'published', 'unverified', true),
  ('Ahmed Al-Farsi',    'Academy Director',          'Gulf Stars FC',        'a.alfarsi@trap-007.footycontacts.io',     NULL, 'Dubai',       'UAE',        'Professional', 'Football', 'Asia',   NULL, NULL, 'published', 'unverified', true),
  ('Natalie Crosby',    'Commercial Manager',        'Lakeside Rovers',      'n.crosby@trap-008.footycontacts.io',      NULL, 'Brisbane',    'Australia',  'Semi-Pro',     'Football', 'Oceania',NULL, NULL, 'published', 'unverified', true),
  ('Tomás Vega',        'Goalkeeping Coach',         'Club Deportivo Suria', 't.vega@trap-009.footycontacts.io',        NULL, 'Bogotá',      'Colombia',   'Professional', 'Football', 'CONMEBOL', NULL, NULL, 'published', 'unverified', true),
  ('Priya Nair',        'Data Scientist',            'Mumbai City Analytics','p.nair@trap-010.footycontacts.io',        NULL, 'Mumbai',      'India',      'Professional', 'Football', 'Asia',   NULL, NULL, 'published', 'unverified', true),
  ('Femi Adeyemi',      'Kit Manager',               'Lagos Premier FC',     'f.adeyemi@trap-011.footycontacts.io',     NULL, 'Lagos',       'Nigeria',    'Professional', 'Football', 'Africa', NULL, NULL, 'published', 'unverified', true),
  ('Claire Tessier',    'Head Physio',               'Stade de Colmar',      'c.tessier@trap-012.footycontacts.io',     NULL, 'Colmar',      'France',     'Semi-Pro',     'Football', 'Europe', NULL, NULL, 'published', 'unverified', true),
  ('Dmitri Kozlov',     'Head Coach',                'FK Volzhsky',          'd.kozlov@trap-013.footycontacts.io',      NULL, 'Volgograd',   'Russia',     'Professional', 'Football', 'Europe', NULL, NULL, 'published', 'unverified', true),
  ('Yuki Tanaka',       'Video Analyst',             'Kawasaki Sports Lab',  'y.tanaka@trap-014.footycontacts.io',      NULL, 'Kawasaki',    'Japan',      'Professional', 'Football', 'Asia',   NULL, NULL, 'published', 'unverified', true),
  ('Isabella Russo',    'Marketing Director',        'Partenope United',     'i.russo@trap-015.footycontacts.io',       NULL, 'Naples',      'Italy',      'Professional', 'Football', 'Europe', NULL, NULL, 'published', 'unverified', true),
  ('Kwame Asante',      'Nutrition Specialist',      'Accra City FC',        'k.asante@trap-016.footycontacts.io',      NULL, 'Accra',       'Ghana',      'Professional', 'Football', 'Africa', NULL, NULL, 'published', 'unverified', true),
  ('Olga Petrovič',     'Youth Development Coach',   'Slovan Breclav',       'o.petrovic@trap-017.footycontacts.io',    NULL, 'Brno',        'Czech Republic', 'Semi-Pro', 'Football', 'Europe', NULL, NULL, 'published', 'unverified', true),
  ('Samuel Whitfield',  'Director of Football',      'Thornton Park FC',     's.whitfield@trap-018.footycontacts.io',   NULL, 'Leeds',       'England',    'Professional', 'Football', 'Europe', NULL, NULL, 'published', 'unverified', true),
  ('Luisa Mendez',      'Community Officer',         'Atletico Patagónico',  'l.mendez@trap-019.footycontacts.io',      NULL, 'Neuquén',     'Argentina',  'Semi-Pro',     'Football', 'CONMEBOL', NULL, NULL, 'published', 'unverified', true),
  ('Henrik Dahl',       'Biomechanics Coach',        'FC Viborg Elite',      'h.dahl@trap-020.footycontacts.io',        NULL, 'Viborg',      'Denmark',    'Professional', 'Football', 'Europe', NULL, NULL, 'published', 'unverified', true);


-- 3. Function: flag any user who unlocks or exports a honeypot contact
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.flag_honeypot_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_honeypot boolean;
BEGIN
  SELECT is_honeypot INTO v_is_honeypot
  FROM public.contacts
  WHERE id = NEW.contact_id;

  IF v_is_honeypot THEN
    INSERT INTO public.scraper_flags (user_id, reason)
    VALUES (
      NEW.user_id,
      'Honeypot contact unlocked: ' || NEW.contact_id::text
    )
    ON CONFLICT DO NOTHING;

    -- Also immediately suspend
    UPDATE public.profiles
    SET
      is_suspended     = true,
      suspended_reason = 'Automated: unlocked a honeypot contact'
    WHERE id = NEW.user_id
      AND is_suspended IS DISTINCT FROM true;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to contact_unlocks
DROP TRIGGER IF EXISTS trg_flag_honeypot_unlock ON public.contact_unlocks;
CREATE TRIGGER trg_flag_honeypot_unlock
  AFTER INSERT ON public.contact_unlocks
  FOR EACH ROW
  EXECUTE FUNCTION public.flag_honeypot_access();


-- 4. Ensure honeypots are excluded from all exports
--    (Belt-and-suspenders: the API also enforces this, but this view
--     prevents accidental exposure via direct queries too.)
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW public.contacts_safe AS
  SELECT * FROM public.contacts WHERE is_honeypot = false;
