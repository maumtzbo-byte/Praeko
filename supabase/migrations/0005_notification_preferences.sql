alter table businesses
  add column notification_preferences jsonb not null default '{"content_ready": true, "weekly_summary": true, "billing": true}'::jsonb;
