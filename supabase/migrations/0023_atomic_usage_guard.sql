-- Frames — close the two usage-counter holes found in the November audit.
--
-- H-02 (race): generateMediaForContent read usage_counters, decided with
-- canGenerateVideo, and only then called increment_usage_counters. The
-- increment was atomic but the *decision* wasn't, so two concurrent
-- submissions (double click, two tabs) both read the same pre-increment
-- numbers, both passed the cap, and both got billed at fal.ai.
-- check_and_increment_usage below does the read, the check and the write
-- under one row lock, so the second caller blocks and then sees the first
-- caller's increment.
--
-- H-03 (no refund): the counter went up when the job was queued and never
-- came back down when fal.ai returned a failure, so a business that hit
-- three provider errors silently lost three videos of the month it paid
-- for. refund_usage_counters is the compensating write.
--
-- Limits are passed in as parameters rather than looked up from `plans`
-- here on purpose: src/lib/plans/limits.ts stays the single source of
-- truth, and duplicating those numbers in SQL would just create two
-- places to keep in sync. Safe because neither function is callable by
-- anon/authenticated — only server code holding the service-role key
-- passes them.

create function check_and_increment_usage(
  p_business_id uuid,
  p_period_month date,
  p_is_video boolean,
  p_requested_seconds integer,
  p_max_videos integer,
  p_max_images integer,
  p_max_seconds integer
) returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_row usage_counters%rowtype;
begin
  -- Make sure the row exists before locking it: `for update` on a row that
  -- isn't there locks nothing, which would leave two concurrent first-ever
  -- generations for a business free to race each other.
  insert into usage_counters (business_id, period_month)
  values (p_business_id, p_period_month)
  on conflict (business_id, period_month) do nothing;

  select * into current_row
  from usage_counters
  where business_id = p_business_id and period_month = p_period_month
  for update;

  if p_is_video then
    if current_row.videos_used >= p_max_videos then
      return 'monthly_video_count_exceeded';
    end if;
    if current_row.video_seconds_used + p_requested_seconds > p_max_seconds then
      return 'exceeds_monthly_seconds_budget';
    end if;
    update usage_counters
      set videos_used = videos_used + 1,
          video_seconds_used = video_seconds_used + p_requested_seconds
      where business_id = p_business_id and period_month = p_period_month;
  else
    -- The image cap was already checked in application code, but through
    -- the same read-then-write gap as video — moving it in here puts both
    -- kinds behind the one lock.
    if current_row.images_used >= p_max_images then
      return 'monthly_image_count_exceeded';
    end if;
    update usage_counters
      set images_used = images_used + 1
      where business_id = p_business_id and period_month = p_period_month;
  end if;

  return 'ok';
end;
$$;

-- Clamped at zero so a double refund (e.g. a retried status poll that sees
-- the same failure twice) can never push a counter negative and hand the
-- business free generations.
create function refund_usage_counters(
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
  update usage_counters
    set images_used = greatest(0, images_used - p_images_delta),
        videos_used = greatest(0, videos_used - p_videos_delta),
        video_seconds_used = greatest(0, video_seconds_used - p_video_seconds_delta)
    where business_id = p_business_id and period_month = p_period_month;
$$;

revoke all on function check_and_increment_usage(uuid, date, boolean, integer, integer, integer, integer) from public;
revoke all on function check_and_increment_usage(uuid, date, boolean, integer, integer, integer, integer) from anon;
revoke all on function check_and_increment_usage(uuid, date, boolean, integer, integer, integer, integer) from authenticated;

revoke all on function refund_usage_counters(uuid, date, integer, integer, integer) from public;
revoke all on function refund_usage_counters(uuid, date, integer, integer, integer) from anon;
revoke all on function refund_usage_counters(uuid, date, integer, integer, integer) from authenticated;
