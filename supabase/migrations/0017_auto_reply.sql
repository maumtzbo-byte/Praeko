-- Praeko — Agente de Respuestas: auto-replies to Instagram/Facebook
-- comments and DMs using the brand's own FAQs/hours/guardrails (already
-- collected in brand_profiles since 0002_onboarding_fields.sql, never used
-- until now). Off by default — a business has to opt in, since an
-- autonomous reply on a public comment or a real customer's DM is higher
-- stakes than anything the other agents do (those only touch a business's
-- own calendar until a human clicks "Publicar").

alter table businesses
  add column auto_reply_enabled boolean not null default false;

create type interaction_type as enum ('comentario', 'mensaje_directo');
create type interaction_reply_status as enum ('respondido', 'necesita_revision', 'fallido');

create table social_interactions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  connection_id uuid references social_connections (id) on delete set null,
  platform social_platform not null,
  interaction_type interaction_type not null,
  external_interaction_id text not null,
  author_name text,
  inbound_text text not null,
  reply_text text,
  reply_status interaction_reply_status not null,
  created_at timestamptz not null default now(),
  -- Meta retries webhook deliveries it doesn't get a fast 200 for — this
  -- makes re-processing the same comment/message a no-op instead of a
  -- duplicate reply.
  unique (platform, external_interaction_id)
);

create index social_interactions_business_id_created_at_idx
  on social_interactions (business_id, created_at);

alter table social_interactions enable row level security;

create policy "social_interactions_select" on social_interactions for select
  using (is_business_member(business_id));

-- No insert/update/delete policy for authenticated/anon — only the
-- /api/webhooks/meta route (service-role client) writes here, same trust
-- boundary as generations/usage_counters.
