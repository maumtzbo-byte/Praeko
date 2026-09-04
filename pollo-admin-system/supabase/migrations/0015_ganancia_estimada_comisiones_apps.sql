-- Las apps de reparto (DiDi, Uber, Rappi) cobran comisión: de cada $100
-- vendidos por esas apps, el negocio solo recibe $65.20 (34.8% de comisión,
-- IVA incluido). "Ganancia estimada" debía reflejar la utilidad real, así
-- que ahora descuenta esa comisión sobre didi/rappi/uber antes de restar
-- los gastos. "Ventas totales" NO cambia — se queda en bruto porque es lo
-- que se usa para cuadrar contra Operación del día.
alter table public.reportes_diarios drop column ganancia_estimada;

alter table public.reportes_diarios
  add column ganancia_estimada numeric(12, 2) generated always as (
    vta_sucursal + tarjeta + deposito + (didi + rappi + uber) * 0.652 - gastos_total
  ) stored;
