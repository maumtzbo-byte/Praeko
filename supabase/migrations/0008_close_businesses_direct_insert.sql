-- Praeko — close direct client-side INSERT into `businesses`.
--
-- All business creation now goes through create_business_for_current_user()
-- (0006_create_business_rpc.sql), a SECURITY DEFINER function that creates
-- the business row and its owner membership atomically. The old
-- `with check (true)` policy existed for the two-step client insert that
-- RPC replaced; leaving it in place let anyone POST directly to
-- /rest/v1/businesses and self-claim ownership via business_members_insert
-- right after, bypassing the RPC's atomicity for no functional benefit —
-- nothing in the app inserts into `businesses` directly anymore.

drop policy "businesses_insert" on businesses;

create policy "businesses_insert" on businesses for insert
  to authenticated
  with check (false);
