-- Praeko — campaigns: a themed, date-bounded content push ("Hot Sale",
-- "Navidad") layered on top of the existing day-to-day content_calendar.
-- A campaign is just a named container + a free-text brief; the pieces it
-- generates are ordinary content_calendar rows tagged with campaign_id, so
-- everything downstream (generation, review, scheduling, publishing) keeps
-- working unchanged — campaigns don't introduce a second content pipeline.

create type campaign_status as enum ('activa', 'completada', 'cancelada');

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  name text not null,
  brief text not null,
  start_date date not null,
  end_date date not null,
  status campaign_status not null default 'activa',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campaigns_date_range_check check (end_date >= start_date)
);

create index campaigns_business_id_idx on campaigns (business_id);

alter table content_calendar
  add column campaign_id uuid references campaigns (id) on delete set null;

create index content_calendar_campaign_id_idx on content_calendar (campaign_id);

create trigger campaigns_set_updated_at before update on campaigns
  for each row execute function set_updated_at();

alter table campaigns enable row level security;

-- Same shape as content_calendar_all (0001_init.sql) — the server action
-- that creates a campaign runs as the logged-in user via the cookie-bound
-- client, not the service role, so business members need direct insert
-- access here too.
create policy "campaigns_all" on campaigns for all
  using (is_business_member(business_id))
  with check (is_business_member(business_id));
