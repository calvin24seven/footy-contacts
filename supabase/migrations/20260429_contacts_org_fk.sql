-- Add FK constraint from contacts.organisation_id → organisations.id
-- This is required for Supabase's TypeScript codegen to emit the
-- Relationship entry in database.types.ts, enabling the join
--   .select("*, organisations(logo_url)")
-- to resolve correctly at the type level.

ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_organisation_id_fkey
  FOREIGN KEY (organisation_id)
  REFERENCES public.organisations(id)
  ON DELETE SET NULL;
