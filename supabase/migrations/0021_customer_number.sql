-- A short, human-friendly sequential id to show a business owner (e.g. on
-- the beta free-month ticket in /dashboard/plan) instead of their internal
-- uuid. Starts at 1001, not 1 — "you're customer #1" reads as suspicious
-- for a real product, #1001 doesn't. GENERATED ALWAYS backfills existing
-- rows with sequential values automatically; unique so it's safe to treat
-- as an identifier, not just a display nicety.
alter table businesses
  add column customer_number bigint generated always as identity (start with 1001) unique;
