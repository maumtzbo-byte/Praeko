-- Tracks a real, growing history of follower counts per connected social
-- account. There is no way to backfill past follower counts (Meta/TikTok
-- don't expose that), so this can only start counting from today forward —
-- one row per connection per day, captured whenever Analíticas is loaded.
-- Same read-only-to-members pattern as social_connections: no insert/update
-- policy for regular users, writes go through the service-role client.

create table social_follower_snapshots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  connection_id uuid not null references social_connections (id) on delete cascade,
  platform social_platform not null,
  followers_count integer not null,
  captured_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (connection_id, captured_date)
);

create index social_follower_snapshots_business_id_idx on social_follower_snapshots (business_id);

alter table social_follower_snapshots enable row level security;

create policy "social_follower_snapshots_select" on social_follower_snapshots for select
  using (is_business_member(business_id));
