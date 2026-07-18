-- Praeko — ledger of support-chat messages, used only to rate-limit calls to
-- the paid Claude API from the "Ayuda" chatbot (see
-- src/app/dashboard/ayuda/actions.ts). Same shape as content_generation_runs
-- (migration 0007): one row per message, no message content stored — the
-- conversation itself is never persisted, only counted.

create table support_chat_messages (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index support_chat_messages_business_id_created_at_idx
  on support_chat_messages (business_id, created_at);

alter table support_chat_messages enable row level security;

create policy "support_chat_messages_select" on support_chat_messages for select
  using (is_business_member(business_id));

create policy "support_chat_messages_insert" on support_chat_messages for insert
  to authenticated
  with check (is_business_member(business_id));
