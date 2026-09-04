-- =====================================================================
-- Notificaciones automáticas de pedidos: los tipos 'pedido_pendiente' y
-- 'pedido_actualizado' ya existían en la tabla notificaciones y ya están
-- soportados en el frontend (etiquetas e íconos), pero ningún trigger los
-- generaba — nadie era alertado cuando llegaba o cambiaba de estado un
-- pedido. Sigue el mismo patrón que notificar_inventario_bajo /
-- notificar_merma_alta ya existentes en 0001_init_schema.sql.
-- =====================================================================

-- TRIGGER: alerta cuando se crea un pedido nuevo
create or replace function public.notificar_pedido_pendiente()
returns trigger
language plpgsql
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

create trigger trg_pedido_pendiente
  after insert on public.pedidos
  for each row execute function public.notificar_pedido_pendiente();

-- TRIGGER: alerta cuando cambia el estado de un pedido existente
create or replace function public.notificar_pedido_actualizado()
returns trigger
language plpgsql
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

create trigger trg_pedido_actualizado
  after update of estado on public.pedidos
  for each row execute function public.notificar_pedido_actualizado();
