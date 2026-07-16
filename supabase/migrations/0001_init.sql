-- Praeko — Fase 1 schema: multi-tenant core, brand profile + asset library,
-- plan limits, content calendar and generation ledger.
--
-- Tenancy model: "un negocio = un tenant". Table names avoid assuming a user
-- can only ever own one business, so multi-business support can be added
-- later without a rename (see business_members).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tenancy
-- ---------------------------------------------------------------------------

create table businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type business_role as enum ('owner', 'editor');

-- Join table: which auth users can act on which business, and with what role.
-- Deliberately many-to-many so a user could belong to >1 business later
-- without changing this table's shape.
create table business_members (
  business_id uuid not null references businesses (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role business_role not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create index business_members_user_id_idx on business_members (user_id);

-- ---------------------------------------------------------------------------
-- Plans (reference data, not tenant-scoped)
-- ---------------------------------------------------------------------------

create type plan_key as enum ('basico', 'pro', 'max');

create table plans (
  key plan_key primary key,
  display_name text not null,
  price_usd_cents integer not null,
  images_per_month integer not null,
  videos_per_month integer not null,
  -- Fixed-duration plans (Básico) set both equal to the fixed length.
  -- Budgeted plans (Pro/Max) use these to derive a seconds-per-month budget:
  -- seconds_budget = videos_per_month * video_avg_seconds.
  video_avg_seconds integer not null,
  video_max_seconds integer not null,
  video_provider text not null,
  burns_subtitles boolean not null default false,
  social_network_limit integer not null,
  has_optimized_schedule boolean not null default false,
  has_analytics_dashboard boolean not null default false,
  has_priority_queue boolean not null default false,
  has_watermark_free_downloads boolean not null default false
);

insert into plans (
  key, display_name, price_usd_cents, images_per_month, videos_per_month,
  video_avg_seconds, video_max_seconds, video_provider, burns_subtitles,
  social_network_limit, has_optimized_schedule, has_analytics_dashboard,
  has_priority_queue, has_watermark_free_downloads
) values
  ('basico', 'Básico', 9900, 22, 8, 10, 10, 'kling-3.0-pro', false, 1, false, false, false, false),
  ('pro', 'Pro', 19900, 15, 15, 15, 25, 'kling-3.0-pro', true, 3, true, true, false, false),
  ('max', 'Max', 39900, 8, 22, 20, 30, 'seedance-2.0-standard-720p', true, 3, true, true, true, true);

-- ---------------------------------------------------------------------------
-- Subscriptions (Stripe-backed; activated only by server-side webhook)
-- ---------------------------------------------------------------------------

create type subscription_status as enum ('active', 'past_due', 'canceled', 'incomplete');

create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  plan_key plan_key not null references plans (key),
  status subscription_status not null default 'incomplete',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index subscriptions_business_id_idx on subscriptions (business_id);

-- ---------------------------------------------------------------------------
-- Brand profile + asset library
-- ---------------------------------------------------------------------------

create table brand_profiles (
  business_id uuid primary key references businesses (id) on delete cascade,
  brand_tone text,
  target_audience text,
  services_offered text,
  liked_content_examples text[],
  website_url text,
  questionnaire jsonb not null default '{}'::jsonb,
  color_palette text[],
  preferred_fonts text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type brand_asset_type as enum ('logo', 'photo', 'video', 'template_reference');

create table brand_assets (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  asset_type brand_asset_type not null,
  storage_path text not null,
  liked boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index brand_assets_business_id_idx on brand_assets (business_id);

-- ---------------------------------------------------------------------------
-- Content calendar + generation ledger
-- ---------------------------------------------------------------------------

create type content_format as enum ('reel', 'carrusel', 'imagen_unica', 'promocion');
create type content_kind as enum ('imagen', 'video');
create type content_status as enum ('pendiente', 'generada', 'en_revision', 'publicada', 'fallida');

create table content_calendar (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  scheduled_date date not null,
  content_kind content_kind not null,
  format content_format not null,
  topic text not null,
  script text,
  target_duration_seconds integer,
  recommended_publish_time time,
  status content_status not null default 'pendiente',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, scheduled_date, format)
);

create index content_calendar_business_id_idx on content_calendar (business_id);

create type quality_review_result as enum ('aprobado', 'necesita_revision_humana', 'rechazado');

create table generations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  content_calendar_id uuid references content_calendar (id) on delete set null,
  content_kind content_kind not null,
  duration_seconds integer not null default 0,
  provider text not null,
  cost_usd numeric(10, 4) not null default 0,
  quality_review_result quality_review_result,
  storage_path text,
  created_at timestamptz not null default now()
);

create index generations_business_id_idx on generations (business_id);
create index generations_business_id_created_at_idx on generations (business_id, created_at);

-- Monthly usage counters — backs the seconds-of-video budget system for
-- Pro/Max (see docs/PHASE_1_PLAN.md). One row per business per calendar month.
create table usage_counters (
  business_id uuid not null references businesses (id) on delete cascade,
  period_month date not null, -- always the first day of the month
  images_used integer not null default 0,
  videos_used integer not null default 0,
  video_seconds_used integer not null default 0,
  primary key (business_id, period_month)
);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger businesses_set_updated_at before update on businesses
  for each row execute function set_updated_at();
create trigger subscriptions_set_updated_at before update on subscriptions
  for each row execute function set_updated_at();
create trigger brand_profiles_set_updated_at before update on brand_profiles
  for each row execute function set_updated_at();
create trigger content_calendar_set_updated_at before update on content_calendar
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — every tenant table, from creation.
-- ---------------------------------------------------------------------------

create function is_business_member(target_business_id uuid) returns boolean as $$
  select exists (
    select 1 from business_members
    where business_id = target_business_id
      and user_id = auth.uid()
  );
$$ language sql security definer stable;

alter table businesses enable row level security;
alter table business_members enable row level security;
alter table subscriptions enable row level security;
alter table brand_profiles enable row level security;
alter table brand_assets enable row level security;
alter table content_calendar enable row level security;
alter table generations enable row level security;
alter table usage_counters enable row level security;
alter table plans enable row level security;

-- plans is public reference data, readable by any authenticated user.
create policy "plans_read_all" on plans for select to authenticated using (true);

create policy "businesses_select" on businesses for select
  using (is_business_member(id));
create policy "businesses_update" on businesses for update
  using (is_business_member(id));
create policy "businesses_insert" on businesses for insert
  to authenticated
  with check (true);

create policy "business_members_select" on business_members for select
  using (is_business_member(business_id));
-- A user may only self-insert as a member of a business that has no members
-- yet — i.e. claiming the orphan row they just created in onboarding step 1.
-- Once a business has an owner, nobody else can grant themselves membership
-- through this policy; that has to go through an existing member's action.
create policy "business_members_insert" on business_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and not exists (
      select 1 from business_members existing
      where existing.business_id = business_members.business_id
    )
  );

create policy "subscriptions_select" on subscriptions for select
  using (is_business_member(business_id));

create policy "brand_profiles_all" on brand_profiles for all
  using (is_business_member(business_id))
  with check (is_business_member(business_id));

create policy "brand_assets_all" on brand_assets for all
  using (is_business_member(business_id))
  with check (is_business_member(business_id));

create policy "content_calendar_all" on content_calendar for all
  using (is_business_member(business_id))
  with check (is_business_member(business_id));

create policy "generations_select" on generations for select
  using (is_business_member(business_id));

create policy "usage_counters_select" on usage_counters for select
  using (is_business_member(business_id));

-- Note: subscriptions/generations/usage_counters are written exclusively by
-- server-side code using the service role key (Stripe webhook, generation
-- worker), which bypasses RLS — no insert/update policy is granted to
-- regular authenticated users on these tables.
