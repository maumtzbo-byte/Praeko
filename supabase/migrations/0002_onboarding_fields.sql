-- Praeko — expands businesses/brand_profiles with every field the
-- onboarding wizard collects (see docs/PHASE_1_PLAN.md and the onboarding
-- spec). Kept on these two existing tables rather than a sprawl of new
-- ones: it's all 1:1 with a business, and jsonb/array columns cover the
-- repeating substructures (social links, FAQs, business hours) without
-- needing extra join tables for an MVP.

-- ---------------------------------------------------------------------------
-- businesses — contact info + onboarding progress
-- ---------------------------------------------------------------------------

alter table businesses
  add column description text,
  add column country text,
  add column city text,
  add column primary_language text,
  add column website_url text,
  add column phone text,
  add column contact_email text,
  add column onboarding_step smallint not null default 1,
  add column onboarding_completed_at timestamptz;

-- ---------------------------------------------------------------------------
-- brand_profiles — brand, social, goals, competition, products, AI guardrails
-- ---------------------------------------------------------------------------

-- website_url now lives on businesses (used for the "analizar sitio web"
-- shortcut before brand_profiles even exists).
alter table brand_profiles drop column if exists website_url;

alter table brand_profiles
  -- Marca
  add column mission text,
  add column brand_values text[] not null default '{}',
  add column personality text,
  -- Redes sociales — {instagram, facebook, tiktok, linkedin, x, youtube}
  -- each an optional handle/url, plus a free-form list for anything else.
  add column social_links jsonb not null default '{}'::jsonb,
  add column other_social_links jsonb not null default '[]'::jsonb,
  -- Objetivos
  add column goals text[] not null default '{}',
  add column goals_other text,
  -- Competencia
  add column main_competitors text[] not null default '{}',
  add column admired_companies text[] not null default '{}',
  add column style_references text[] not null default '{}',
  -- Productos o servicios
  add column sells_description text,
  add column product_categories text[] not null default '{}',
  add column main_products text[] not null default '{}',
  add column average_ticket text,
  add column frequent_promotions text,
  -- Información para la IA
  add column ai_forbidden_topics text,
  add column ai_forbidden_words text[] not null default '{}',
  add column ai_response_style text,
  add column faqs jsonb not null default '[]'::jsonb,
  add column business_hours jsonb not null default '{}'::jsonb,
  add column address text,
  add column additional_info text;

comment on column brand_profiles.social_links is
  'Fixed platforms: {instagram?, facebook?, tiktok?, linkedin?, x?, youtube?: string}';
comment on column brand_profiles.other_social_links is
  'Freeform extras: [{label: string, url: string}]';
comment on column brand_profiles.faqs is
  '[{question: string, answer: string}]';
comment on column brand_profiles.business_hours is
  'Freeform by day: {mon?, tue?, wed?, thu?, fri?, sat?, sun?: string}';
