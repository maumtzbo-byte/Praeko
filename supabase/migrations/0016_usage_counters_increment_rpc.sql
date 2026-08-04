-- Praeko — atomic usage-counter increments for Agente Creativo.
--
-- usage_counters existed since 0001_init.sql (and the dashboard already
-- reads it for the "cerca del límite" banner) but nothing ever wrote to it,
-- so the plan's images_per_month/videos_per_month caps were never actually
-- enforced against real fal.ai spend — generateMediaForContent could be
-- clicked without limit. This RPC is the write side: a single atomic
-- upsert-with-delta so two concurrent generations for the same business
-- can't race each other into undercounting (a plain
-- select-then-insert/update from application code could).

create function increment_usage_counters(
  p_business_id uuid,
  p_period_month date,
  p_images_delta integer default 0,
  p_videos_delta integer default 0,
  p_video_seconds_delta integer default 0
) returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into usage_counters (business_id, period_month, images_used, videos_used, video_seconds_used)
  values (p_business_id, p_period_month, p_images_delta, p_videos_delta, p_video_seconds_delta)
  on conflict (business_id, period_month) do update
    set images_used = usage_counters.images_used + excluded.images_used,
        videos_used = usage_counters.videos_used + excluded.videos_used,
        video_seconds_used = usage_counters.video_seconds_used + excluded.video_seconds_used;
$$;

-- Called only from server code using the service-role client (same trust
-- boundary as the generations/usage_counters writes it supports) — no
-- authenticated/anon grant, matching create_business_for_current_user's
-- least-privilege posture in 0006/0009.
revoke all on function increment_usage_counters(uuid, date, integer, integer, integer) from public;
revoke all on function increment_usage_counters(uuid, date, integer, integer, integer) from anon;
revoke all on function increment_usage_counters(uuid, date, integer, integer, integer) from authenticated;
