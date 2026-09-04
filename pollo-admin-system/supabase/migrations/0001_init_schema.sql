-- =====================================================================
-- Pollo Admin System — esquema inicial
-- Sistema de administración para cadena de pollerías (multi-sucursal)
-- =====================================================================

create extension if not exists "pgcrypto";

-- =====================================================================
-- 1. ROLES
-- =====================================================================
create table public.roles (
  id            smallint primary key generated always as identity,
  clave         text not null unique check (clave in ('administrador', 'encargado', 'empleado')),
  nombre        text not null,
  descripcion   text,
  created_at    timestamptz not null default now()
);

comment on table public.roles is 'Catálogo de roles del sistema y sus permisos generales.';

insert into public.roles (clave, nombre, descripcion) values
  ('administrador', 'Administrador', 'Acceso total al sistema, todas las sucursales.'),
  ('encargado', 'Encargado', 'Administra una sucursal: reportes, inventario, pedidos, gastos.'),
  ('empleado', 'Empleado', 'Acceso operativo limitado dentro de su sucursal.');

-- =====================================================================
-- 2. SUCURSALES
-- =====================================================================
create table public.sucursales (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  direccion     text not null,
  telefono      text,
  responsable   text,
  estado        text not null default 'activa' check (estado in ('activa', 'inactiva')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_sucursales_estado on public.sucursales (estado);

-- =====================================================================
-- 3. USUARIOS (extiende auth.users)
-- =====================================================================
create table public.usuarios (
  id            uuid primary key references auth.users (id) on delete cascade,
  nombre        text not null,
  email         text not null unique,
  telefono      text,
  rol_id        smallint not null references public.roles (id),
  sucursal_id   uuid references public.sucursales (id) on delete set null,
  estado        text not null default 'activo' check (estado in ('activo', 'inactivo')),
  avatar_url    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_usuarios_sucursal on public.usuarios (sucursal_id);
create index idx_usuarios_rol on public.usuarios (rol_id);

-- =====================================================================
-- 4. CATEGORIAS (de productos)
-- =====================================================================
create table public.categorias (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null unique,
  descripcion   text,
  created_at    timestamptz not null default now()
);

-- =====================================================================
-- 5. PRODUCTOS
-- =====================================================================
create table public.productos (
  id             uuid primary key default gen_random_uuid(),
  nombre         text not null,
  categoria_id   uuid references public.categorias (id) on delete set null,
  unidad         text not null default 'pieza' check (unidad in ('pieza', 'kg', 'g', 'litro', 'ml', 'paquete', 'caja', 'bolsa')),
  precio_venta   numeric(10, 2) not null default 0 check (precio_venta >= 0),
  costo          numeric(10, 2) not null default 0 check (costo >= 0),
  activo         boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index idx_productos_categoria on public.productos (categoria_id);
create index idx_productos_activo on public.productos (activo);

-- =====================================================================
-- 6. INVENTARIO (por sucursal)
-- =====================================================================
create table public.inventario (
  id               uuid primary key default gen_random_uuid(),
  sucursal_id      uuid not null references public.sucursales (id) on delete cascade,
  producto_id      uuid not null references public.productos (id) on delete cascade,
  cantidad_actual  numeric(12, 2) not null default 0 check (cantidad_actual >= 0),
  stock_minimo     numeric(12, 2) not null default 0 check (stock_minimo >= 0),
  costo_unitario   numeric(10, 2) not null default 0 check (costo_unitario >= 0),
  updated_at       timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  unique (sucursal_id, producto_id)
);

create index idx_inventario_sucursal on public.inventario (sucursal_id);
create index idx_inventario_producto on public.inventario (producto_id);
create index idx_inventario_bajo on public.inventario (sucursal_id) where cantidad_actual <= stock_minimo;

-- =====================================================================
-- 7. REPORTES DIARIOS
-- =====================================================================
create table public.reportes_diarios (
  id                    uuid primary key default gen_random_uuid(),
  sucursal_id           uuid not null references public.sucursales (id) on delete cascade,
  usuario_id            uuid not null references public.usuarios (id),
  fecha                 date not null,
  ventas_efectivo       numeric(12, 2) not null default 0 check (ventas_efectivo >= 0),
  ventas_tarjeta        numeric(12, 2) not null default 0 check (ventas_tarjeta >= 0),
  ventas_transferencia  numeric(12, 2) not null default 0 check (ventas_transferencia >= 0),
  gastos_total          numeric(12, 2) not null default 0 check (gastos_total >= 0),
  pollos_recibidos      integer not null default 0 check (pollos_recibidos >= 0),
  pollos_vendidos       integer not null default 0 check (pollos_vendidos >= 0),
  productos_danados     integer not null default 0 check (productos_danados >= 0),
  merma_total           numeric(12, 2) not null default 0 check (merma_total >= 0),
  observaciones         text,
  notas                 text,
  ventas_totales        numeric(12, 2) generated always as
                           (ventas_efectivo + ventas_tarjeta + ventas_transferencia) stored,
  ganancia_estimada     numeric(12, 2) generated always as
                           (ventas_efectivo + ventas_tarjeta + ventas_transferencia - gastos_total) stored,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (sucursal_id, fecha)
);

create index idx_reportes_sucursal_fecha on public.reportes_diarios (sucursal_id, fecha desc);
create index idx_reportes_fecha on public.reportes_diarios (fecha desc);
create index idx_reportes_usuario on public.reportes_diarios (usuario_id);

-- =====================================================================
-- 8. VENTAS (detalle de productos vendidos)
-- =====================================================================
create table public.ventas (
  id                uuid primary key default gen_random_uuid(),
  sucursal_id       uuid not null references public.sucursales (id) on delete cascade,
  reporte_id        uuid references public.reportes_diarios (id) on delete cascade,
  producto_id       uuid not null references public.productos (id),
  usuario_id        uuid not null references public.usuarios (id),
  cantidad          numeric(12, 2) not null check (cantidad > 0),
  precio_unitario   numeric(10, 2) not null check (precio_unitario >= 0),
  subtotal          numeric(12, 2) generated always as (cantidad * precio_unitario) stored,
  metodo_pago       text not null default 'efectivo' check (metodo_pago in ('efectivo', 'tarjeta', 'transferencia')),
  fecha             date not null default current_date,
  created_at        timestamptz not null default now()
);

create index idx_ventas_sucursal_fecha on public.ventas (sucursal_id, fecha desc);
create index idx_ventas_producto on public.ventas (producto_id);
create index idx_ventas_reporte on public.ventas (reporte_id);

-- =====================================================================
-- 9. GASTOS
-- =====================================================================
create table public.gastos (
  id              uuid primary key default gen_random_uuid(),
  sucursal_id     uuid not null references public.sucursales (id) on delete cascade,
  usuario_id      uuid not null references public.usuarios (id),
  categoria_id    uuid references public.categorias (id) on delete set null,
  monto           numeric(12, 2) not null check (monto > 0),
  concepto        text not null,
  descripcion     text,
  fecha           date not null default current_date,
  comprobante_url text,
  created_at      timestamptz not null default now()
);

create index idx_gastos_sucursal_fecha on public.gastos (sucursal_id, fecha desc);
create index idx_gastos_categoria on public.gastos (categoria_id);

-- =====================================================================
-- 10. PEDIDOS (solicitudes de producto entre sucursal y central)
-- =====================================================================
create table public.pedidos (
  id            uuid primary key default gen_random_uuid(),
  sucursal_id   uuid not null references public.sucursales (id) on delete cascade,
  producto_id   uuid not null references public.productos (id),
  usuario_id    uuid not null references public.usuarios (id),
  cantidad      numeric(12, 2) not null check (cantidad > 0),
  comentario    text,
  prioridad     text not null default 'normal' check (prioridad in ('baja', 'normal', 'alta', 'urgente')),
  estado        text not null default 'pendiente'
                  check (estado in ('pendiente', 'aceptado', 'en_preparacion', 'enviado', 'recibido', 'cancelado')),
  fecha         date not null default current_date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index idx_pedidos_sucursal on public.pedidos (sucursal_id, estado);
create index idx_pedidos_estado on public.pedidos (estado);
create index idx_pedidos_producto on public.pedidos (producto_id);

-- =====================================================================
-- 11. MERMAS
-- =====================================================================
create table public.mermas (
  id              uuid primary key default gen_random_uuid(),
  sucursal_id     uuid not null references public.sucursales (id) on delete cascade,
  producto_id     uuid not null references public.productos (id),
  usuario_id      uuid not null references public.usuarios (id),
  cantidad        numeric(12, 2) not null check (cantidad > 0),
  motivo          text not null check (motivo in ('caducidad', 'dano_fisico', 'mal_manejo', 'transporte', 'refrigeracion', 'otro')),
  fecha           date not null default current_date,
  observaciones   text,
  created_at      timestamptz not null default now()
);

create index idx_mermas_sucursal_fecha on public.mermas (sucursal_id, fecha desc);
create index idx_mermas_producto on public.mermas (producto_id);

-- =====================================================================
-- 12. NOTIFICACIONES
-- =====================================================================
create table public.notificaciones (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid references public.usuarios (id) on delete cascade,
  sucursal_id   uuid references public.sucursales (id) on delete cascade,
  tipo          text not null check (tipo in ('reporte_faltante', 'inventario_bajo', 'merma_alta', 'pedido_pendiente', 'pedido_actualizado', 'general')),
  titulo        text not null,
  mensaje       text not null,
  leida         boolean not null default false,
  link          text,
  created_at    timestamptz not null default now()
);

create index idx_notificaciones_usuario on public.notificaciones (usuario_id, leida);
create index idx_notificaciones_sucursal on public.notificaciones (sucursal_id);
create index idx_notificaciones_created on public.notificaciones (created_at desc);

-- =====================================================================
-- 13. HISTORIAL DE CAMBIOS (auditoría)
-- =====================================================================
create table public.historial_cambios (
  id            uuid primary key default gen_random_uuid(),
  tabla         text not null,
  registro_id   uuid not null,
  accion        text not null check (accion in ('crear', 'actualizar', 'eliminar')),
  usuario_id    uuid references public.usuarios (id) on delete set null,
  sucursal_id   uuid references public.sucursales (id) on delete set null,
  datos_previos jsonb,
  datos_nuevos  jsonb,
  created_at    timestamptz not null default now()
);

create index idx_historial_tabla_registro on public.historial_cambios (tabla, registro_id);
create index idx_historial_sucursal on public.historial_cambios (sucursal_id);
create index idx_historial_created on public.historial_cambios (created_at desc);

-- =====================================================================
-- FUNCIONES DE APOYO (SECURITY DEFINER — evitan recursión de RLS)
-- =====================================================================
create or replace function public.current_usuario_rol()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select r.clave
  from public.usuarios u
  join public.roles r on r.id = u.rol_id
  where u.id = auth.uid()
$$;

create or replace function public.current_usuario_sucursal()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select sucursal_id from public.usuarios where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.current_usuario_rol() = 'administrador'
$$;

create or replace function public.is_encargado_o_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.current_usuario_rol() in ('administrador', 'encargado')
$$;

-- =====================================================================
-- TRIGGERS: updated_at automático
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_sucursales_updated_at before update on public.sucursales
  for each row execute function public.set_updated_at();
create trigger trg_usuarios_updated_at before update on public.usuarios
  for each row execute function public.set_updated_at();
create trigger trg_productos_updated_at before update on public.productos
  for each row execute function public.set_updated_at();
create trigger trg_inventario_updated_at before update on public.inventario
  for each row execute function public.set_updated_at();
create trigger trg_reportes_updated_at before update on public.reportes_diarios
  for each row execute function public.set_updated_at();
create trigger trg_pedidos_updated_at before update on public.pedidos
  for each row execute function public.set_updated_at();

-- =====================================================================
-- TRIGGER: alerta automática de inventario bajo
-- =====================================================================
create or replace function public.notificar_inventario_bajo()
returns trigger
language plpgsql
as $$
declare
  v_producto_nombre text;
  v_admin record;
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

create trigger trg_inventario_bajo
  after insert or update of cantidad_actual on public.inventario
  for each row execute function public.notificar_inventario_bajo();

-- =====================================================================
-- TRIGGER: alerta automática de merma alta (> 20 unidades en un registro)
-- =====================================================================
create or replace function public.notificar_merma_alta()
returns trigger
language plpgsql
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

create trigger trg_merma_alta
  after insert on public.mermas
  for each row execute function public.notificar_merma_alta();

-- =====================================================================
-- TRIGGER: auditoría automática (historial de cambios)
-- =====================================================================
create or replace function public.registrar_historial()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sucursal_id uuid;
begin
  begin
    v_sucursal_id := coalesce((to_jsonb(new)->>'sucursal_id')::uuid, (to_jsonb(old)->>'sucursal_id')::uuid);
  exception when others then
    v_sucursal_id := null;
  end;

  insert into public.historial_cambios (tabla, registro_id, accion, usuario_id, sucursal_id, datos_previos, datos_nuevos)
  values (
    tg_table_name,
    coalesce((to_jsonb(new)->>'id')::uuid, (to_jsonb(old)->>'id')::uuid),
    case tg_op when 'INSERT' then 'crear' when 'UPDATE' then 'actualizar' else 'eliminar' end,
    auth.uid(),
    v_sucursal_id,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );
  return coalesce(new, old);
end;
$$;

create trigger trg_historial_pedidos
  after insert or update or delete on public.pedidos
  for each row execute function public.registrar_historial();
create trigger trg_historial_reportes
  after insert or update or delete on public.reportes_diarios
  for each row execute function public.registrar_historial();
create trigger trg_historial_inventario
  after insert or update or delete on public.inventario
  for each row execute function public.registrar_historial();

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
alter table public.roles enable row level security;
alter table public.sucursales enable row level security;
alter table public.usuarios enable row level security;
alter table public.categorias enable row level security;
alter table public.productos enable row level security;
alter table public.inventario enable row level security;
alter table public.reportes_diarios enable row level security;
alter table public.ventas enable row level security;
alter table public.gastos enable row level security;
alter table public.pedidos enable row level security;
alter table public.mermas enable row level security;
alter table public.notificaciones enable row level security;
alter table public.historial_cambios enable row level security;

-- ROLES: lectura para cualquier usuario autenticado
create policy roles_select on public.roles for select
  to authenticated using (true);

-- SUCURSALES: admin ve todas; encargado/empleado solo la propia
create policy sucursales_select on public.sucursales for select
  to authenticated using (
    public.is_admin() or id = public.current_usuario_sucursal()
  );
create policy sucursales_insert on public.sucursales for insert
  to authenticated with check (public.is_admin());
create policy sucursales_update on public.sucursales for update
  to authenticated using (public.is_admin());
create policy sucursales_delete on public.sucursales for delete
  to authenticated using (public.is_admin());

-- USUARIOS: admin ve todos; los demás ven su propio perfil y compañeros de sucursal
create policy usuarios_select on public.usuarios for select
  to authenticated using (
    public.is_admin() or id = auth.uid() or sucursal_id = public.current_usuario_sucursal()
  );
create policy usuarios_insert on public.usuarios for insert
  to authenticated with check (public.is_admin() or id = auth.uid());
create policy usuarios_update on public.usuarios for update
  to authenticated using (public.is_admin() or id = auth.uid());
create policy usuarios_delete on public.usuarios for delete
  to authenticated using (public.is_admin());

-- CATEGORIAS: lectura para todos los autenticados; escritura admin/encargado
create policy categorias_select on public.categorias for select
  to authenticated using (true);
create policy categorias_write on public.categorias for insert
  to authenticated with check (public.is_encargado_o_admin());
create policy categorias_update on public.categorias for update
  to authenticated using (public.is_encargado_o_admin());
create policy categorias_delete on public.categorias for delete
  to authenticated using (public.is_admin());

-- PRODUCTOS: lectura para todos los autenticados; escritura admin/encargado
create policy productos_select on public.productos for select
  to authenticated using (true);
create policy productos_insert on public.productos for insert
  to authenticated with check (public.is_encargado_o_admin());
create policy productos_update on public.productos for update
  to authenticated using (public.is_encargado_o_admin());
create policy productos_delete on public.productos for delete
  to authenticated using (public.is_admin());

-- INVENTARIO: solo su sucursal (admin ve todo)
create policy inventario_select on public.inventario for select
  to authenticated using (
    public.is_admin() or sucursal_id = public.current_usuario_sucursal()
  );
create policy inventario_insert on public.inventario for insert
  to authenticated with check (
    public.is_admin() or sucursal_id = public.current_usuario_sucursal()
  );
create policy inventario_update on public.inventario for update
  to authenticated using (
    public.is_admin() or sucursal_id = public.current_usuario_sucursal()
  );
create policy inventario_delete on public.inventario for delete
  to authenticated using (public.is_admin());

-- REPORTES DIARIOS: solo su sucursal (admin ve todo)
create policy reportes_select on public.reportes_diarios for select
  to authenticated using (
    public.is_admin() or sucursal_id = public.current_usuario_sucursal()
  );
create policy reportes_insert on public.reportes_diarios for insert
  to authenticated with check (
    public.is_admin() or sucursal_id = public.current_usuario_sucursal()
  );
create policy reportes_update on public.reportes_diarios for update
  to authenticated using (
    public.is_admin() or sucursal_id = public.current_usuario_sucursal()
  );
create policy reportes_delete on public.reportes_diarios for delete
  to authenticated using (public.is_admin());

-- VENTAS: solo su sucursal (admin ve todo)
create policy ventas_select on public.ventas for select
  to authenticated using (
    public.is_admin() or sucursal_id = public.current_usuario_sucursal()
  );
create policy ventas_insert on public.ventas for insert
  to authenticated with check (
    public.is_admin() or sucursal_id = public.current_usuario_sucursal()
  );
create policy ventas_update on public.ventas for update
  to authenticated using (
    public.is_admin() or sucursal_id = public.current_usuario_sucursal()
  );
create policy ventas_delete on public.ventas for delete
  to authenticated using (
    public.is_admin() or sucursal_id = public.current_usuario_sucursal()
  );

-- GASTOS: solo su sucursal (admin ve todo)
create policy gastos_select on public.gastos for select
  to authenticated using (
    public.is_admin() or sucursal_id = public.current_usuario_sucursal()
  );
create policy gastos_insert on public.gastos for insert
  to authenticated with check (
    public.is_admin() or sucursal_id = public.current_usuario_sucursal()
  );
create policy gastos_update on public.gastos for update
  to authenticated using (
    public.is_admin() or sucursal_id = public.current_usuario_sucursal()
  );
create policy gastos_delete on public.gastos for delete
  to authenticated using (public.is_admin());

-- PEDIDOS: solo su sucursal (admin ve/gestiona todo)
create policy pedidos_select on public.pedidos for select
  to authenticated using (
    public.is_admin() or sucursal_id = public.current_usuario_sucursal()
  );
create policy pedidos_insert on public.pedidos for insert
  to authenticated with check (
    public.is_admin() or sucursal_id = public.current_usuario_sucursal()
  );
create policy pedidos_update on public.pedidos for update
  to authenticated using (
    public.is_admin() or sucursal_id = public.current_usuario_sucursal()
  );
create policy pedidos_delete on public.pedidos for delete
  to authenticated using (public.is_admin());

-- MERMAS: solo su sucursal (admin ve todo)
create policy mermas_select on public.mermas for select
  to authenticated using (
    public.is_admin() or sucursal_id = public.current_usuario_sucursal()
  );
create policy mermas_insert on public.mermas for insert
  to authenticated with check (
    public.is_admin() or sucursal_id = public.current_usuario_sucursal()
  );
create policy mermas_update on public.mermas for update
  to authenticated using (public.is_admin());
create policy mermas_delete on public.mermas for delete
  to authenticated using (public.is_admin());

-- NOTIFICACIONES: propias, de su sucursal, o generales; admin ve todo
create policy notificaciones_select on public.notificaciones for select
  to authenticated using (
    public.is_admin()
    or usuario_id = auth.uid()
    or sucursal_id = public.current_usuario_sucursal()
    or (usuario_id is null and sucursal_id is null)
  );
create policy notificaciones_insert on public.notificaciones for insert
  to authenticated with check (true);
create policy notificaciones_update on public.notificaciones for update
  to authenticated using (
    public.is_admin() or usuario_id = auth.uid() or sucursal_id = public.current_usuario_sucursal()
  );
create policy notificaciones_delete on public.notificaciones for delete
  to authenticated using (public.is_admin() or usuario_id = auth.uid());

-- HISTORIAL: admin ve todo; encargado/empleado ve el de su sucursal
create policy historial_select on public.historial_cambios for select
  to authenticated using (
    public.is_admin() or sucursal_id = public.current_usuario_sucursal()
  );

-- =====================================================================
-- STORAGE: bucket para comprobantes de gastos
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('comprobantes', 'comprobantes', false)
on conflict (id) do nothing;

create policy comprobantes_select on storage.objects for select
  to authenticated using (bucket_id = 'comprobantes');
create policy comprobantes_insert on storage.objects for insert
  to authenticated with check (bucket_id = 'comprobantes');
create policy comprobantes_delete on storage.objects for delete
  to authenticated using (bucket_id = 'comprobantes' and public.is_admin());
