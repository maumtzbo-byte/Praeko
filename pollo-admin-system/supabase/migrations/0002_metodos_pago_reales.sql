-- =====================================================================
-- Reemplaza el desglose genérico de venta (efectivo/tarjeta/transferencia)
-- por las categorías reales que usa Pimpollo en su reporte diario en papel:
-- Vta sucursal, Tarjeta, Depósito, DiDi, Rappi, Uber — más un campo de
-- texto "Recolectó" (quién recogió el dinero).
--
-- Las columnas existentes se RENOMBRAN (no se borran) para conservar el
-- historial de reportes ya capturados:
--   ventas_efectivo      -> vta_sucursal
--   ventas_tarjeta       -> tarjeta
--   ventas_transferencia -> deposito
-- =====================================================================

-- 1. reportes_diarios: renombrar columnas existentes (conserva los datos)
alter table public.reportes_diarios rename column ventas_efectivo to vta_sucursal;
alter table public.reportes_diarios rename column ventas_tarjeta to tarjeta;
alter table public.reportes_diarios rename column ventas_transferencia to deposito;

-- 2. reportes_diarios: agregar las nuevas columnas
alter table public.reportes_diarios add column didi numeric(12, 2) not null default 0 check (didi >= 0);
alter table public.reportes_diarios add column rappi numeric(12, 2) not null default 0 check (rappi >= 0);
alter table public.reportes_diarios add column uber numeric(12, 2) not null default 0 check (uber >= 0);
alter table public.reportes_diarios add column recolecto text;

-- 3. reportes_diarios: las columnas generadas no se pueden alterar in-place,
--    hay que quitarlas y recrearlas con la fórmula que incluye las 3 nuevas
alter table public.reportes_diarios drop column ventas_totales;
alter table public.reportes_diarios drop column ganancia_estimada;

alter table public.reportes_diarios add column ventas_totales numeric(12, 2) generated always as
  (vta_sucursal + tarjeta + deposito + didi + rappi + uber) stored;
alter table public.reportes_diarios add column ganancia_estimada numeric(12, 2) generated always as
  (vta_sucursal + tarjeta + deposito + didi + rappi + uber - gastos_total) stored;

-- 4. ventas (detalle por producto): quitar la restricción vieja PRIMERO
--    (si no, el UPDATE de abajo choca contra el check constraint viejo,
--    que todavía no permite los valores nuevos)
alter table public.ventas drop constraint if exists ventas_metodo_pago_check;

-- 5. mapear los valores existentes a las nuevas categorías
update public.ventas set metodo_pago = 'vta_sucursal' where metodo_pago = 'efectivo';
update public.ventas set metodo_pago = 'deposito' where metodo_pago = 'transferencia';

-- 6. poner la restricción nueva (ahora todos los valores ya son válidos)
alter table public.ventas add constraint ventas_metodo_pago_check
  check (metodo_pago in ('vta_sucursal', 'tarjeta', 'deposito', 'didi', 'rappi', 'uber'));
alter table public.ventas alter column metodo_pago set default 'vta_sucursal';
