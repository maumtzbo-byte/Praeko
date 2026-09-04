-- Los encargados capturan el Efectivo ya neto de los gastos del día (pagan
-- los gastos del mismo dinero antes de reportarlo, como el "entregado" de
-- los reportes en papel). Esto significaba dos problemas:
--
-- 1. "Ganancia estimada" restaba los gastos DOS veces: una implícita (el
--    efectivo ya viene reducido) y otra explícita (- gastos_total). Se
--    quita la resta explícita.
-- 2. El cuadre comparaba Operación del día contra Ventas por método de
--    pago directo, así que siempre marcaba "falta dinero" por el monto
--    exacto de los gastos del día, aunque estuviera bien. Ahora compara
--    contra (Ventas + Gastos), sumando de vuelta lo que ya se restó.
alter table public.reportes_diarios drop column ganancia_estimada;

alter table public.reportes_diarios
  add column ganancia_estimada numeric(12, 2) generated always as (
    vta_sucursal + tarjeta + deposito + (didi + rappi + uber) * 0.652
  ) stored;

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
  if abs(new.operacion_total - (new.ventas_totales + new.gastos_total)) <= 1 then
    return new;
  end if;

  v_diferencia := new.operacion_total - (new.ventas_totales + new.gastos_total);
  v_diferencia_texto := case
    when v_diferencia > 0 then
      'Faltan $' || to_char(v_diferencia, 'FM999,999,990.00') || ' en método de pago para que cuadre. '
      || 'Esto pasa cuando falta capturar dinero de algún método de pago, o falta efectivo por registrar.'
    else
      'Sobran $' || to_char(abs(v_diferencia), 'FM999,999,990.00') || ' en método de pago respecto a lo vendido. '
      || 'Esto pasa cuando falta capturar algún producto vendido, o se registró un pago de más.'
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
        ' pero los métodos de pago (más los gastos ya descontados del efectivo) suman $' ||
        to_char(new.ventas_totales + new.gastos_total, 'FM999,999,990.00') ||
        '. ' || v_diferencia_texto || ' Revisa el reporte de ese día.',
      '/reportes-diarios'
    );
  end if;

  return new;
end;
$$;
