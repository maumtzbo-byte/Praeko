-- "Complementos" y "Extras" dejan de ser un solo número: cada uno es en
-- realidad una categoría de varios productos vendibles al mismo precio
-- ($45 c/u los de Complementos, $10 c/u los de Extras), y hay que saber
-- cuál se vendió para el detalle del inventario/ventas.
alter table public.reportes_diarios
  add column complementos_frijoles  integer not null default 0 check (complementos_frijoles >= 0),
  add column complementos_salchicha integer not null default 0 check (complementos_salchicha >= 0),
  add column complementos_coditos  integer not null default 0 check (complementos_coditos >= 0),
  add column complementos_arroz    integer not null default 0 check (complementos_arroz >= 0),
  add column complementos_cebolla  integer not null default 0 check (complementos_cebolla >= 0),
  add column extras_totopos        integer not null default 0 check (extras_totopos >= 0),
  add column extras_salsas         integer not null default 0 check (extras_salsas >= 0),
  add column extras_tortillas      integer not null default 0 check (extras_tortillas >= 0);

alter table public.reportes_diarios drop column operacion_total;
alter table public.reportes_diarios drop column venta_complementos;
alter table public.reportes_diarios drop column venta_extras;

alter table public.reportes_diarios
  add column operacion_total numeric(12, 2) generated always as (
    pollo_completo * 219 + medio_pollo * 120 +
    (complementos_frijoles + complementos_salchicha + complementos_coditos + complementos_arroz + complementos_cebolla) * 45 +
    (extras_totopos + extras_salsas + extras_tortillas) * 10 +
    promo_miercoles * 219 + promo_2x * 340 + promo_1_5 * 279
  ) stored;
