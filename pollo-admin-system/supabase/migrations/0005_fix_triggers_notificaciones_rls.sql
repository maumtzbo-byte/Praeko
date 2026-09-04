-- =====================================================================
-- FIX: los triggers que generan notificaciones automáticas fallaban por RLS.
--
-- La política `notificaciones_insert` solo permite insertar a administradores
-- (`with check (is_admin())`). Los triggers corrían con los permisos del
-- usuario que dispara la acción (encargado/empleado), así que al intentar
-- crear la notificación la política los rechazaba y —al ser parte de la misma
-- transacción— tumbaba la operación completa con "No tienes permiso para
-- realizar esta acción":
--   - crear un pedido            -> trg_pedido_pendiente
--   - cambiar estado de pedido   -> trg_pedido_actualizado
--   - actualizar inventario bajo -> trg_inventario_bajo
--   - registrar merma alta       -> trg_merma_alta
--
-- Solución: marcar las 4 funciones como SECURITY DEFINER (mismo patrón que
-- ya usa `registrar_historial`), para que la notificación se inserte como
-- acción del sistema y no del usuario. Las políticas de lectura no cambian:
-- cada quien sigue viendo solo las notificaciones de su sucursal.
-- =====================================================================

create or replace function public.notificar_pedido_pendiente()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_producto_nombre text;
begin
  select nombre into v_producto_nombre from public.productos where id = new.producto_id;

  insert into public.notificaciones (sucursal_id, tipo, titulo, mensaje, link)
  values (
    new.sucursal_id,
    'pedido_pendiente',
    'Nuevo pedido pendiente',
    'Se solicitó un pedido de ' || new.cantidad || ' unidades de "' ||
      coalesce(v_producto_nombre, '') || '".',
    '/pedidos'
  );
  return new;
end;
$$;

create or replace function public.notificar_pedido_actualizado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_producto_nombre text;
begin
  if new.estado is distinct from old.estado then
    select nombre into v_producto_nombre from public.productos where id = new.producto_id;

    insert into public.notificaciones (sucursal_id, tipo, titulo, mensaje, link)
    values (
      new.sucursal_id,
      'pedido_actualizado',
      'Pedido actualizado',
      'El pedido de "' || coalesce(v_producto_nombre, '') || '" cambió a: ' || new.estado || '.',
      '/pedidos'
    );
  end if;
  return new;
end;
$$;

create or replace function public.notificar_inventario_bajo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_producto_nombre text;
begin
  if new.cantidad_actual <= new.stock_minimo
     and (tg_op = 'INSERT' or old.cantidad_actual > old.stock_minimo) then

    select nombre into v_producto_nombre from public.productos where id = new.producto_id;

    insert into public.notificaciones (sucursal_id, tipo, titulo, mensaje, link)
    values (
      new.sucursal_id,
      'inventario_bajo',
      'Stock bajo: ' || coalesce(v_producto_nombre, 'producto'),
      'El producto "' || coalesce(v_producto_nombre, '') || '" alcanzó el stock mínimo (' ||
        new.cantidad_actual || ' / mínimo ' || new.stock_minimo || ').',
      '/inventario'
    );
  end if;
  return new;
end;
$$;

create or replace function public.notificar_merma_alta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_producto_nombre text;
begin
  if new.cantidad >= 20 then
    select nombre into v_producto_nombre from public.productos where id = new.producto_id;

    insert into public.notificaciones (sucursal_id, tipo, titulo, mensaje, link)
    values (
      new.sucursal_id,
      'merma_alta',
      'Merma alta registrada',
      'Se registró una merma de ' || new.cantidad || ' unidades de "' ||
        coalesce(v_producto_nombre, '') || '".',
      '/mermas'
    );
  end if;
  return new;
end;
$$;
