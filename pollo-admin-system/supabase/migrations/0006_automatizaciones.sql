-- =====================================================================
-- Dos automatizaciones que corren enteramente dentro de la base de datos,
-- sin ninguna API externa ni llaves de nada:
--
-- 1. Recordatorio de "reporte faltante": un job programado (pg_cron) que
--    revisa cada noche si alguna sucursal activa no capturó el reporte
--    diario de hoy, y si no, genera la notificación automática (el tipo
--    'reporte_faltante' ya existía en la tabla y en el frontend, solo
--    faltaba quién la disparara).
--
-- 2. Pedido automático de reabastecimiento: cuando el inventario de un
--    producto cae a su stock mínimo (o menos), se genera automáticamente
--    un pedido en estado "pendiente" para que el encargado solo lo
--    confirme, en vez de tener que armarlo desde cero. No genera pedidos
--    duplicados mientras ya haya uno sin resolver para ese producto.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Recordatorio de reporte faltante
-- ---------------------------------------------------------------------
create extension if not exists pg_cron;

create or replace function public.recordar_reportes_faltantes()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hoy date := (now() at time zone 'America/Mexico_City')::date;
  v_sucursal record;
begin
  for v_sucursal in select id, nombre from public.sucursales where estado = 'activa' loop
    if not exists (
      select 1 from public.reportes_diarios
      where sucursal_id = v_sucursal.id and fecha = v_hoy
    ) then
      -- Evita duplicar el aviso si el job llegara a correr más de una vez el mismo día.
      if not exists (
        select 1 from public.notificaciones
        where sucursal_id = v_sucursal.id
          and tipo = 'reporte_faltante'
          and (created_at at time zone 'America/Mexico_City')::date = v_hoy
      ) then
        insert into public.notificaciones (sucursal_id, tipo, titulo, mensaje, link)
        values (
          v_sucursal.id,
          'reporte_faltante',
          'Falta el reporte de hoy',
          'La sucursal "' || v_sucursal.nombre || '" todavía no ha capturado el reporte diario de hoy.',
          '/reportes-diarios'
        );
      end if;
    end if;
  end loop;
end;
$$;

-- Corre todos los días a las 02:00 UTC = 8:00pm hora de Ciudad de México
-- (UTC-6 todo el año, México no usa horario de verano desde 2022).
do $$
begin
  if exists (select 1 from cron.job where jobname = 'recordar-reportes-faltantes') then
    perform cron.unschedule('recordar-reportes-faltantes');
  end if;
end $$;

select cron.schedule(
  'recordar-reportes-faltantes',
  '0 2 * * *',
  $$select public.recordar_reportes_faltantes();$$
);

-- ---------------------------------------------------------------------
-- 2. Pedido automático cuando el inventario cae al mínimo
-- ---------------------------------------------------------------------
create or replace function public.auto_generar_pedido_reabastecimiento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_id uuid;
  v_pedido_existente uuid;
begin
  if new.cantidad_actual > new.stock_minimo then
    return new;
  end if;

  -- Ya hay un pedido sin resolver para este producto en esta sucursal: no duplicar.
  select id into v_pedido_existente
  from public.pedidos
  where sucursal_id = new.sucursal_id
    and producto_id = new.producto_id
    and estado in ('pendiente', 'aceptado', 'en_preparacion', 'enviado')
  limit 1;

  if v_pedido_existente is not null then
    return new;
  end if;

  -- Se asigna al encargado de la sucursal; si no hay, a un administrador.
  select u.id into v_usuario_id
  from public.usuarios u
  join public.roles r on r.id = u.rol_id
  where u.sucursal_id = new.sucursal_id and r.clave = 'encargado' and u.estado = 'activo'
  order by u.created_at
  limit 1;

  if v_usuario_id is null then
    select u.id into v_usuario_id
    from public.usuarios u
    join public.roles r on r.id = u.rol_id
    where r.clave = 'administrador' and u.estado = 'activo'
    order by u.created_at
    limit 1;
  end if;

  -- Sin nadie a quién asignarlo (sucursal sin encargado ni admin activo), no se genera.
  if v_usuario_id is null then
    return new;
  end if;

  insert into public.pedidos (sucursal_id, producto_id, usuario_id, cantidad, comentario, prioridad, estado, fecha)
  values (
    new.sucursal_id,
    new.producto_id,
    v_usuario_id,
    greatest(new.stock_minimo, 1),
    'Pedido generado automáticamente: el inventario llegó a su stock mínimo.',
    'alta',
    'pendiente',
    (now() at time zone 'America/Mexico_City')::date
  );

  return new;
end;
$$;

create trigger trg_auto_pedido_reabastecimiento
  after insert or update of cantidad_actual on public.inventario
  for each row execute function public.auto_generar_pedido_reabastecimiento();
