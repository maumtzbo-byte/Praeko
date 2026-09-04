-- Separa los gastos en dos tipos: "fijo" (renta, sueldos — se capturan en la
-- sección Gastos fijos) y "normal" (gasto del día a día — se capturan
-- directamente dentro del Reporte diario).
alter table gastos add column tipo text not null default 'normal' check (tipo in ('normal', 'fijo'));
