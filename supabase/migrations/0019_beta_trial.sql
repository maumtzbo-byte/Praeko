-- Marks a subscription as a free beta trial (vs. a real paid one), so the
-- founder can tell them apart later (reporting, follow-up emails when a
-- trial is ending) without guessing from plan_key + dates alone.
alter table subscriptions
  add column is_beta_trial boolean not null default false;
