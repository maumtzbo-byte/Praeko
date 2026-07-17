-- Praeko — ledger of content-generation agent runs, used to rate-limit
-- calls to the paid Claude API from "Generar contenido" (see
-- src/app/dashboard/generar-contenido/actions.ts). One row per successful
-- run; the server action counts today's rows for the business before
-- calling Claude again.

create table content_generation_runs (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  days_requested integer not null,
  created_at timestamptz not null default now()
);

create index content_generation_runs_business_id_created_at_idx
  on content_generation_runs (business_id, created_at);

alter table content_generation_runs enable row level security;

create policy "content_generation_runs_select" on content_generation_runs for select
  using (is_business_member(business_id));

create policy "content_generation_runs_insert" on content_generation_runs for insert
  to authenticated
  with check (is_business_member(business_id));
