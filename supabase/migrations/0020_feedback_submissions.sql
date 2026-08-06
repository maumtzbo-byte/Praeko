-- Monthly in-app NPS-style prompt: "1-5 estrellas, ¿cómo ha sido tu
-- experiencia?" + an optional free-text recommendation. One row per
-- submission (not one row per business updated in place) so the history
-- over time is preserved, not just the latest answer.
create table feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  recommendation text,
  created_at timestamptz not null default now()
);

-- Every "has this business already submitted feedback this month" check
-- (see shouldPromptFeedback in src/app/dashboard/layout.tsx) filters by
-- business_id + a created_at lower bound — index matches that access
-- pattern directly.
create index feedback_submissions_business_id_idx on feedback_submissions (business_id, created_at desc);

alter table feedback_submissions enable row level security;

create policy "feedback_submissions_select" on feedback_submissions for select
  using (is_business_member(business_id));

create policy "feedback_submissions_insert" on feedback_submissions for insert
  with check (is_business_member(business_id));
