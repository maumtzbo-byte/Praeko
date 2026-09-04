-- La alerta de descuadre al admin ahora dice cuánto dinero falta o sobra
-- para cuadrar, no solo los dos totales que no coinciden.
create or replace function public.detectar_descuadre_reporte()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_titulo text;
  v_sucursal_nombre text;
  v_diferencia numeric;
  v_diferencia_texto text;
begin
  if abs(new.operacion_total - new.ventas_totales) <= 1 then
    return new;
  end if;

  v_diferencia := new.operacion_total - new.ventas_totales;
  v_diferencia_texto := case
    when v_diferencia > 0 then 'Faltan $' || to_char(v_diferencia, 'FM999,999,990.00') || ' en método de pago para que cuadre.'
    else 'Sobran $' || to_char(abs(v_diferencia), 'FM999,999,990.00') || ' en método de pago respecto a lo vendido.'
  end;

  select nombre into v_sucursal_nombre from public.sucursales where id = new.sucursal_id;
  v_titulo := 'Descuadre en el reporte del ' || to_char(new.fecha, 'DD/MM') || ' — ' || coalesce(v_sucursal_nombre, '');

  if not exists (
    select 1 from public.notificaciones where sucursal_id = new.sucursal_id and tipo = 'general' and titulo = v_titulo
  ) then
    insert into public.notificaciones (sucursal_id, tipo, titulo, mensaje, link)
    values (
      new.sucursal_id,
      'general',
      v_titulo,
      'Los productos vendidos suman $' || to_char(new.operacion_total, 'FM999,999,990.00') ||
        ' pero los métodos de pago suman $' || to_char(new.ventas_totales, 'FM999,999,990.00') ||
        '. ' || v_diferencia_texto || ' Revisa el reporte de ese día.',
      '/reportes-diarios'
    );
  end if;

  return new;
end;
$$;
