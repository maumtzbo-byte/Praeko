-- Reportes de faltantes (semanal, mensual, anual): resumen automático de
-- los días que no cuadraron en el periodo, por sucursal. Se manda como
-- notificación (la ve la sucursal y el admin, igual que el resumen
-- semanal ya existente) — no satura con notificaciones si no hubo faltantes.
create or replace function public.generar_reporte_faltantes(p_inicio date, p_fin date, p_titulo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sucursal record;
  v_dias_descuadre integer;
  v_total_faltante numeric;
  v_total_sobrante numeric;
begin
  for v_sucursal in select id, nombre from public.sucursales where estado = 'activa' loop
    select
      count(*) filter (where abs(operacion_total - (ventas_totales + gastos_total)) > 1),
      coalesce(sum(greatest(operacion_total - (ventas_totales + gastos_total), 0)), 0),
      coalesce(sum(greatest((ventas_totales + gastos_total) - operacion_total, 0)), 0)
      into v_dias_descuadre, v_total_faltante, v_total_sobrante
    from public.reportes_diarios
    where sucursal_id = v_sucursal.id and fecha between p_inicio and p_fin;

    if coalesce(v_dias_descuadre, 0) = 0 then
      continue;
    end if;

    insert into public.notificaciones (sucursal_id, tipo, titulo, mensaje, link)
    values (
      v_sucursal.id,
      'general',
      p_titulo || ': ' || v_sucursal.nombre,
      'Del ' || to_char(p_inicio, 'DD/MM/YYYY') || ' al ' || to_char(p_fin, 'DD/MM/YYYY') || ' hubo ' ||
        v_dias_descuadre || ' día(s) que no cuadraron.' ||
        case when v_total_faltante > 0 then ' Faltante acumulado: $' || to_char(v_total_faltante, 'FM999,999,990.00') || '.' else '' end ||
        case when v_total_sobrante > 0 then ' Sobrante acumulado: $' || to_char(v_total_sobrante, 'FM999,999,990.00') || '.' else '' end ||
        ' Revisa el detalle en Historial de reportes.',
      '/reportes'
    );
  end loop;
end;
$$;

create or replace function public.reporte_faltantes_semanal()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hoy date := (now() at time zone 'America/Mexico_City')::date;
  v_inicio date := date_trunc('week', v_hoy)::date - 7;
  v_fin date := v_inicio + 6;
begin
  perform public.generar_reporte_faltantes(v_inicio, v_fin, 'Reporte semanal de faltantes');
end;
$$;

create or replace function public.reporte_faltantes_mensual()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hoy date := (now() at time zone 'America/Mexico_City')::date;
  v_inicio date := (date_trunc('month', v_hoy) - interval '1 month')::date;
  v_fin date := (date_trunc('month', v_hoy) - interval '1 day')::date;
begin
  perform public.generar_reporte_faltantes(v_inicio, v_fin, 'Reporte mensual de faltantes');
end;
$$;

create or replace function public.reporte_faltantes_anual()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hoy date := (now() at time zone 'America/Mexico_City')::date;
  v_inicio date := (date_trunc('year', v_hoy) - interval '1 year')::date;
  v_fin date := (date_trunc('year', v_hoy) - interval '1 day')::date;
begin
  perform public.generar_reporte_faltantes(v_inicio, v_fin, 'Reporte anual de faltantes');
end;
$$;

select cron.schedule('reporte-faltantes-semanal', '0 13 * * 1', $$select public.reporte_faltantes_semanal();$$);
select cron.schedule('reporte-faltantes-mensual', '0 13 1 * *', $$select public.reporte_faltantes_mensual();$$);
select cron.schedule('reporte-faltantes-anual', '0 13 1 1 *', $$select public.reporte_faltantes_anual();$$);
