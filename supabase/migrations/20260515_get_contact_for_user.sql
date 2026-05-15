-- Migration: get_contact_for_user RPC
-- Purpose: Return contact row to the calling user, stripping sensitive fields
--          (email, phone, linkedin_url) unless the user has unlocked the contact.
-- Security: SECURITY DEFINER runs as the function owner (postgres), so it can
--           read all columns. auth.uid() is used to check unlock status safely.
-- This replaces the previous select("*") pattern which exposed gated fields in
-- the server-rendered HTML before the user had unlocked the contact.

create or replace function get_contact_for_user(p_contact_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_contact     contacts%rowtype;
  v_is_unlocked boolean := false;
begin
  -- Fetch published contact only
  select * into v_contact
  from contacts
  where id = p_contact_id
    and visibility_status = 'published';

  if not found then
    return null;
  end if;

  -- Check if the calling user has already unlocked this contact
  if auth.uid() is not null then
    select exists(
      select 1
      from contact_unlocks
      where contact_id = p_contact_id
        and user_id    = auth.uid()
    ) into v_is_unlocked;
  end if;

  if v_is_unlocked then
    -- Return the full row including sensitive fields
    return row_to_json(v_contact);
  else
    -- Return safe fields only — email, phone, linkedin_url intentionally excluded
    return json_build_object(
      'id',               v_contact.id,
      'name',             v_contact.name,
      'role',             v_contact.role,
      'organisation',     v_contact.organisation,
      'category',         v_contact.category,
      'role_category',    v_contact.role_category,
      'country',          v_contact.country,
      'city',             v_contact.city,
      'verified_status',  v_contact.verified_status,
      'has_email',        v_contact.has_email,
      'has_phone',        v_contact.has_phone,
      'has_linkedin',     v_contact.has_linkedin,
      'visibility_status',v_contact.visibility_status,
      'created_at',       v_contact.created_at,
      'updated_at',       v_contact.updated_at
    );
  end if;
end;
$$;

-- Grant execute to authenticated users only
revoke execute on function get_contact_for_user(uuid) from public;
grant  execute on function get_contact_for_user(uuid) to authenticated;

comment on function get_contact_for_user(uuid) is
  'Returns a contact row for the authenticated user. Sensitive fields (email, phone, linkedin_url) are only included if the user has an entry in contact_unlocks for this contact.';
