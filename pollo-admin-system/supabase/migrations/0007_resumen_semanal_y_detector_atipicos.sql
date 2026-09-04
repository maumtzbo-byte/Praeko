-- =====================================================================
-- Dos automatizaciones más, mismo espíritu (100% base de datos, sin
-- servicios externos):
--
-- 3. Resumen semanal automático: cada lunes a las 6am (hora CDMX) se
--    arma solo un resumen de la semana pasada por sucursal (ventas,
--    gastos, ganancia, comparado contra la semana anterior) y se manda
--    como notificación — reutiliza el tipo 'general' que ya existía.
--
-- 4. Detector de reportes atípicos: cuando se captura o edita un
--    reporte diario, se compara contra el promedio histórico de ese
--    mismo día de la semana en esa sucursal (últimas ~10 semanas). Si
--    la venta total es 3 veces más alta o menos de la cuarta parte de
--    lo normal, se genera una alerta para revisar — pensado para
--    cachar errores de dedo (un cero de más/de menos) antes de que
--    descuadren el mes. No bloquea el guardado, solo avisa.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 3. Resumen semanal
-- ---------------------------------------------------------------------
create or replace function public.generar_resumen_semanal()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hoy date := (now() at time zone 'America/Mexico_City')::date;
  v_inicio_pasada date;
  v_fin_pasada date;
  v_inicio_anterior date;
  v_fin_anterior date;
  v_sucursal record;
  v_ventas numeric;
  v_gastos numeric;
  v_ganancia numeric;
  v_ventas_ant numeric;
  v_pct numeric;
begin
  -- date_trunc('week', ...) da el lunes de la semana que contiene la fecha,
  -- así que esto funciona sin importar qué día corra realmente el job.
  v_inicio_pasada := date_trunc('week', v_hoy)::date - 7;
  v_fin_pasada := v_inicio_pasada + 6;
  v_inicio_anterior := v_inicio_pasada - 7;
  v_fin_anterior := v_inicio_pasada - 1;

  for v_sucursal in select id, nombre from public.sucursales where estado = 'activa' loop
    if not exists (
      select 1 from public.reportes_diarios
      where sucursal_id = v_sucursal.id and fecha between v_inicio_pasada and v_fin_pasada
    ) then
      continue; -- sin reportes esa semana, no mandar un resumen vacío
    end if;

    select coalesce(sum(ventas_totales), 0), coalesce(sum(gastos_total), 0), coalesce(sum(ganancia_estimada), 0)
      into v_ventas, v_gastos, v_ganancia
    from public.reportes_diarios
    where sucursal_id = v_sucursal.id and fecha between v_inicio_pasada and v_fin_pasada;

    select coalesce(sum(ventas_totales), 0) into v_ventas_ant
    from public.reportes_diarios
    where sucursal_id = v_sucursal.id and fecha between v_inicio_anterior and v_fin_anterior;

    if v_ventas_ant > 0 then
      v_pct := round(((v_ventas - v_ventas_ant) / v_ventas_ant) * 100, 1);
    else
      v_pct := null;
    end if;

    insert into public.notificaciones (sucursal_id, tipo, titulo, mensaje, link)
    values (
      v_sucursal.id,
      'general',
      'Resumen semanal: ' || v_sucursal.nombre,
      'Del ' || to_char(v_inicio_pasada, 'DD/MM') || ' al ' || to_char(v_fin_pasada, 'DD/MM') || ' — Ventas: $' ||
        to_char(v_ventas, 'FM999,999,990.00') ||
        case when v_pct is not null then
          ' (' || case when v_pct >= 0 then '+' else '' end || v_pct || '% vs. semana anterior)'
        else '' end ||
        ' · Gastos: $' || to_char(v_gastos, 'FM999,999,990.00') ||
        ' · Ganancia: $' || to_char(v_ganancia, 'FM999,999,990.00') || '.',
      '/reportes'
    );
  end loop;
end;
$$;

do $$
begin
  if exists (select 1 from cron.job where jobname = 'resumen-semanal') then
    perform cron.unschedule('resumen-semanal');
  end if;
end $$;

-- Todos los lunes a las 12:00 UTC = 6:00am hora de Ciudad de México.
select cron.schedule(
  'resumen-semanal',
  '0 12 * * 1',
  $$select public.generar_resumen_semanal();$$
);

-- ---------------------------------------------------------------------
-- 4. Detector de reportes atípicos
-- ---------------------------------------------------------------------
create or replace function public.detectar_reporte_atipico()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_promedio numeric;
  v_n int;
  v_dow int := extract(dow from new.fecha);
  v_titulo text;
begin
  select avg(ventas_totales), count(*)
    into v_promedio, v_n
  from public.reportes_diarios
  where sucursal_id = new.sucursal_id
    and id <> new.id
    and fecha < new.fecha
    and fecha >= new.fecha - interval '70 days'
    and extract(dow from fecha) = v_dow;

  -- con menos de 3 reportes previos del mismo día de la semana no hay
  -- base confiable para comparar (evita falsos positivos al arrancar).
  if v_n < 3 or v_promedio is null or v_promedio = 0 then
    return new;
  end if;

  if new.ventas_totales > v_promedio * 3 or new.ventas_totales < v_promedio * 0.25 then
    v_titulo := 'Revisa el reporte del ' || to_char(new.fecha, 'DD/MM');

    -- evita duplicar la alerta si el mismo reporte se edita varias veces
    -- seguidas y sigue viéndose atípico.
    if not exists (
      select 1 from public.notificaciones
      where sucursal_id = new.sucursal_id and tipo = 'general' and titulo = v_titulo
    ) then
      insert into public.notificaciones (sucursal_id, tipo, titulo, mensaje, link)
      values (
        new.sucursal_id,
        'general',
        v_titulo,
        'Las ventas totales ($' || to_char(new.ventas_totales, 'FM999,999,990.00') ||
          ') se ven muy distintas al promedio de ese día (' || to_char(v_promedio, 'FM999,999,990.00') ||
          '). Puede ser correcto, pero vale la pena revisar que no haya un error de captura.',
        '/reportes-diarios'
      );
    end if;
  end if;

  return new;
end;
$$;

create trigger trg_reporte_atipico
  after insert or update on public.reportes_diarios
  for each row execute function public.detectar_reporte_atipico();
