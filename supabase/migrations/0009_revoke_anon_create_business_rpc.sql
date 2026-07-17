-- Praeko — anon should never be able to call create_business_for_current_user.
--
-- Supabase's project-level default privileges grant EXECUTE to `anon` on
-- newly created functions in the public schema. The `revoke all ... from
-- public` in 0006_create_business_rpc.sql only removed the implicit PUBLIC
-- grant, not this separate direct grant to `anon`, so unauthenticated
-- callers still showed up with EXECUTE (harmless in practice only because
-- the function itself checks auth.uid() and raises otherwise) — closing it
-- here too, for least privilege / to satisfy the security advisor.

revoke execute on function create_business_for_current_user(
  text, text, text, text, text, text, text, text, text
) from anon;
