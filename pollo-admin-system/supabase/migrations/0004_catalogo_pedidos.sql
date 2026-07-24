-- =====================================================================
-- Catálogo real de Pedidos: reemplaza los productos de ejemplo genéricos
-- de las categorías "Complementos" e "Insumos" (definidos en seed.sql)
-- por los artículos reales que pide Pimpollo. 100% aditivo y seguro de
-- re-correr: no depende de que el seed genérico haya llegado a aplicarse.
-- =====================================================================

-- 1. Asegurar que existan las categorías (no truena si ya existen)
insert into public.categorias (nombre, descripcion) values
  ('Complementos', 'Tortillas, salsas y acompañamientos'),
  ('Insumos', 'Materia prima e insumos operativos')
on conflict (nombre) do nothing;

-- 2. Productos reales de Complementos
insert into public.productos (nombre, categoria_id, unidad, precio_venta, costo)
select v.nombre, c.id, v.unidad, 0, 0
from (values
  ('Pollos',    'pieza'),
  ('Coditos',   'kg'),
  ('Arroz',     'kg'),
  ('Frijol',    'kg'),
  ('Totopos',   'bolsa'),
  ('Cocida',    'litro'),
  ('Cruda',     'litro'),
  ('Cebollas',  'kg'),
  ('Jalapeños', 'kg')
) as v(nombre, unidad)
join public.categorias c on c.nombre = 'Complementos'
where not exists (
  select 1 from public.productos p where p.nombre = v.nombre and p.categoria_id = c.id
);

-- 3. Productos reales de Insumos
insert into public.productos (nombre, categoria_id, unidad, precio_venta, costo)
select v.nombre, c.id, v.unidad, 0, 0
from (values
  ('Carbón',          'kg'),
  ('Tomate',          'kg'),
  ('Zanahoria',       'kg'),
  ('Chile serrano',   'kg'),
  ('Chile jalapeño',  'kg'),
  ('Chile morrón',    'kg'),
  ('Cebolla',         'kg'),
  ('Aderezo',         'litro'),
  ('Sal',             'kg'),
  ('Pimienta',        'kg'),
  ('Ajo',             'kg'),
  ('Cilantro',        'kg'),
  ('Lechuga',         'kg'),
  ('Tocino',          'kg'),
  ('Chorizo',         'kg'),
  ('Salchicha asar',  'kg'),
  ('Frijol',          'kg'),
  ('Arroz',           'kg'),
  ('Coditos',         'kg'),
  ('Jamón',           'kg'),
  ('Consomé',         'kg'),
  ('Pollo',           'kg'),
  ('Nuggets',         'kg'),
  ('Piernas',         'kg'),
  ('Muslos',          'kg'),
  ('Tiras',           'kg'),
  ('Papas',           'kg')
) as v(nombre, unidad)
join public.categorias c on c.nombre = 'Insumos'
where not exists (
  select 1 from public.productos p where p.nombre = v.nombre and p.categoria_id = c.id
);

-- 4. Desactivar (no borrar) los productos de ejemplo genéricos que ya no
--    aplican, por si el seed genérico llegó a correr en esta base. Se usa
--    activo=false en vez de DELETE para no arriesgar un error de llave
--    foránea si ya se usaron en algún pedido/venta histórico.
update public.productos p
set activo = false
from public.categorias c
where p.categoria_id = c.id
  and (
    (c.nombre = 'Complementos' and p.nombre in ('Tortillas', 'Salsa verde', 'Salsa roja'))
    or (c.nombre = 'Insumos' and p.nombre in ('Gas LP', 'Hielo'))
  );
