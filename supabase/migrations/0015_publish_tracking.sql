-- Praeko — Agente de Publicación: records where a piece actually got
-- published once it does. v1 keeps this simple: one content_calendar row
-- publishes to exactly one connected account, chosen at publish time (no
-- multi-platform fan-out yet — see AGENTS follow-up notes).

alter table content_calendar
  add column published_platform social_platform,
  add column external_post_id text;
