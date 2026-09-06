-- Frames — límites por suscripción (planes ajustables) + carrusel como
-- línea propia.
--
-- Hasta ahora los límites vivían únicamente en `plans`, indexados por un
-- enum de tres valores, así que un negocio solo podía tener exactamente una
-- de tres combinaciones. Estas columnas dejan que una suscripción ajuste
-- cualquiera de esas cantidades sin dejar de pertenecer a su plan: NULL
-- significa "usa el default del plan", un valor significa "este negocio
-- negoció esta cantidad". Nullable a propósito — las suscripciones que ya
-- existen siguen funcionando sin tocarlas ni migrar datos.
--
-- El carrusel pasa a contarse aparte. Antes consumía un crédito de imagen
-- (content_kind = 'imagen', format = 'carrusel'), lo que impedía venderlo o
-- limitarlo por separado aunque su costo real sea el de varias imágenes.

alter table subscriptions
  add column custom_videos_per_month integer,
  add column custom_images_per_month integer,
  add column custom_carousels_per_month integer,
  add column custom_video_max_seconds integer,
  -- Precio calculado al armar el plan. Se guarda en vez de recalcularse al
  -- vuelo porque es lo que se le cotizó al cliente: si mañana cambian las
  -- tarifas, quien ya contrató conserva el precio con el que se dio de alta.
  add column custom_price_usd_cents integer;

alter table usage_counters
  add column carousels_used integer not null default 0;

-- Guardas contra cantidades absurdas escritas por error desde el servidor —
-- el configurador ya acota en la UI, pero la base no debería depender de eso.
alter table subscriptions
  add constraint subscriptions_custom_limits_non_negative check (
    coalesce(custom_videos_per_month, 0) >= 0
    and coalesce(custom_images_per_month, 0) >= 0
    and coalesce(custom_carousels_per_month, 0) >= 0
    and coalesce(custom_video_max_seconds, 1) > 0
    and coalesce(custom_price_usd_cents, 0) >= 0
  );

-- El guard de 0023 solo distinguía video/imagen. Se reemplaza por una
-- versión con tres tipos; misma mecánica de lock de fila, misma razón (ver
-- 0023_atomic_usage_guard.sql para el detalle de la carrera que cierra).
drop function if exists check_and_increment_usage(uuid, date, boolean, integer, integer, integer, integer);

create function check_and_increment_usage(
  p_business_id uuid,
  p_period_month date,
  p_kind text, -- 'video' | 'imagen' | 'carrusel'
  p_requested_seconds integer,
  p_max_videos integer,
  p_max_images integer,
  p_max_carousels integer,
  p_max_seconds integer
) returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_row usage_counters%rowtype;
begin
  insert into usage_counters (business_id, period_month)
  values (p_business_id, p_period_month)
  on conflict (business_id, period_month) do nothing;

  select * into current_row
  from usage_counters
  where business_id = p_business_id and period_month = p_period_month
  for update;

  if p_kind = 'video' then
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

  elsif p_kind = 'carrusel' then
    if current_row.carousels_used >= p_max_carousels then
      return 'monthly_carousel_count_exceeded';
    end if;
    update usage_counters
      set carousels_used = carousels_used + 1
      where business_id = p_business_id and period_month = p_period_month;

  elsif p_kind = 'imagen' then
    if current_row.images_used >= p_max_images then
      return 'monthly_image_count_exceeded';
    end if;
    update usage_counters
      set images_used = images_used + 1
      where business_id = p_business_id and period_month = p_period_month;

  else
    -- Un tipo desconocido nunca debe consumir cupo en silencio.
    return 'unknown_kind';
  end if;

  return 'ok';
end;
$$;

drop function if exists refund_usage_counters(uuid, date, integer, integer, integer);

create function refund_usage_counters(
  p_business_id uuid,
  p_period_month date,
  p_images_delta integer default 0,
  p_videos_delta integer default 0,
  p_video_seconds_delta integer default 0,
  p_carousels_delta integer default 0
) returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  update usage_counters
    set images_used = greatest(0, images_used - p_images_delta),
        videos_used = greatest(0, videos_used - p_videos_delta),
        video_seconds_used = greatest(0, video_seconds_used - p_video_seconds_delta),
        carousels_used = greatest(0, carousels_used - p_carousels_delta)
    where business_id = p_business_id and period_month = p_period_month;
$$;

revoke all on function check_and_increment_usage(uuid, date, text, integer, integer, integer, integer, integer) from public;
revoke all on function check_and_increment_usage(uuid, date, text, integer, integer, integer, integer, integer) from anon;
revoke all on function check_and_increment_usage(uuid, date, text, integer, integer, integer, integer, integer) from authenticated;

revoke all on function refund_usage_counters(uuid, date, integer, integer, integer, integer) from public;
revoke all on function refund_usage_counters(uuid, date, integer, integer, integer, integer) from anon;
revoke all on function refund_usage_counters(uuid, date, integer, integer, integer, integer) from authenticated;
