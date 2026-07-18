-- Praeko — real OAuth-connected social accounts (Instagram, Facebook,
-- TikTok), Fase 2. Split into two tables so a business's own members can
-- read connection status (for the "Redes sociales" page) while the actual
-- OAuth tokens stay reachable only from trusted server code — same pattern
-- already used for subscriptions/generations/usage_counters: no
-- insert/update/delete policy for regular users, all writes go through
-- route handlers using the service-role client.

create type social_platform as enum ('instagram', 'facebook', 'tiktok');
create type social_connection_status as enum ('active', 'error');

create table social_connections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  platform social_platform not null,
  external_account_id text not null,
  external_account_name text not null,
  external_account_avatar_url text,
  status social_connection_status not null default 'active',
  connected_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, platform)
);

create index social_connections_business_id_idx on social_connections (business_id);

-- Kept separate from social_connections so tokens never appear in a select
-- policy granted to end users — connection_id is also its primary key,
-- enforcing the 1:1 relationship without a redundant surrogate id.
create table social_connection_tokens (
  connection_id uuid primary key references social_connections (id) on delete cascade,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz
);

create trigger social_connections_set_updated_at before update on social_connections
  for each row execute function set_updated_at();

alter table social_connections enable row level security;
alter table social_connection_tokens enable row level security;

create policy "social_connections_select" on social_connections for select
  using (is_business_member(business_id));

-- No policies at all on social_connection_tokens for authenticated/anon —
-- only the service-role client (OAuth route handlers) can read or write it.
