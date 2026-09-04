-- =====================================================================
-- "Operación del día" pasa de números sueltos (pollos vendidos a mano)
-- a un desglose por producto/promo real del negocio, con precio fijo:
--   Pollo Completo $219, Medio Pollo $120, Complementos $45, Extras $10,
--   Promoción Miércoles (pollo y medio) $219, Promo 2 pollos $340,
--   Promo pollo y medio $279.
--
-- Se agrega una columna generada `operacion_total` (cantidad × precio fijo
-- de cada producto, sumado) para poder comparar contra `ventas_totales`
-- (lo capturado en "Ventas por método de pago") y detectar descuadres —
-- pensado como control anti-robo: si el dinero que dicen que entró no
-- coincide con lo que dicen haber vendido, se avisa al admin.
--
-- IMPORTANTE: estos precios están fijos aquí Y en el frontend
-- (src/lib/menu-precios.ts) — si cambian los precios del menú, hay que
-- actualizar los dos lados.
-- =====================================================================

alter table public.reportes_diarios
  add column pollo_completo    integer not null default 0 check (pollo_completo >= 0),
  add column medio_pollo       integer not null default 0 check (medio_pollo >= 0),
  add column venta_complementos integer not null default 0 check (venta_complementos >= 0),
  add column venta_extras      integer not null default 0 check (venta_extras >= 0),
  add column promo_miercoles   integer not null default 0 check (promo_miercoles >= 0),
  add column promo_2x          integer not null default 0 check (promo_2x >= 0),
  add column promo_1_5         integer not null default 0 check (promo_1_5 >= 0);

alter table public.reportes_diarios
  add column operacion_total numeric(12, 2) generated always as (
    pollo_completo * 219 + medio_pollo * 120 + venta_complementos * 45 + venta_extras * 10 +
    promo_miercoles * 219 + promo_2x * 340 + promo_1_5 * 279
  ) stored;

-- ---------------------------------------------------------------------
-- Alerta de descuadre: lo vendido (por producto) vs. lo cobrado (por
-- método de pago) debe coincidir. Tolerancia de $1 por redondeos.
-- ---------------------------------------------------------------------
create or replace function public.detectar_descuadre_reporte()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_titulo text;
  v_sucursal_nombre text;
begin
  if abs(new.operacion_total - new.ventas_totales) <= 1 then
    return new;
  end if;

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
        '. Revisa el reporte de ese día.',
      '/reportes-diarios'
    );
  end if;

  return new;
end;
$$;

create trigger trg_descuadre_reporte
  after insert or update on public.reportes_diarios
  for each row execute function public.detectar_descuadre_reporte();
