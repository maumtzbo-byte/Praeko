-- Praeko — atomic "create my business" RPC.
--
-- Onboarding step 1 needs to insert the businesses row AND the
-- business_members(owner) row, then read the new business id back. Doing
-- that as two separate client-side inserts hits a chicken-and-egg RLS
-- problem: `insert ... returning id` is subject to the SELECT policy too,
-- and businesses_select requires is_business_member(id) — which is false
-- until the second insert runs. A SECURITY DEFINER function (owned by a
-- role with BYPASSRLS, as `postgres` is on Supabase) does both inserts in
-- one transaction without hitting that ordering problem.

create function create_business_for_current_user(
  p_name text,
  p_description text,
  p_industry text,
  p_country text,
  p_city text,
  p_primary_language text,
  p_website_url text,
  p_phone text,
  p_contact_email text
) returns businesses
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_business businesses;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  insert into businesses (
    name, description, industry, country, city,
    primary_language, website_url, phone, contact_email, onboarding_step
  ) values (
    p_name, p_description, p_industry, p_country, p_city,
    p_primary_language, p_website_url, p_phone, p_contact_email, 2
  )
  returning * into new_business;

  insert into business_members (business_id, user_id, role)
  values (new_business.id, auth.uid(), 'owner');

  return new_business;
end;
$$;

revoke all on function create_business_for_current_user(
  text, text, text, text, text, text, text, text, text
) from public;
grant execute on function create_business_for_current_user(
  text, text, text, text, text, text, text, text, text
) to authenticated;
