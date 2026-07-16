-- Fixes for the advisor warnings surfaced right after 0001-0003:
--   - mutable search_path on SECURITY DEFINER / trigger functions
--   - is_business_member callable by anon/authenticated via PostgREST RPC

alter function set_updated_at() set search_path = public, pg_temp;
alter function is_business_member(uuid) set search_path = public, pg_temp;

revoke all on function is_business_member(uuid) from public;
revoke all on function is_business_member(uuid) from anon;
grant execute on function is_business_member(uuid) to authenticated;
