-- =====================================================================
-- Datos de referencia (catálogos). Idempotente: seguro de re-ejecutar.
-- Los usuarios demo y datos transaccionales (ventas, pedidos, gastos,
-- mermas, reportes) se generan con `npm run seed`, ya que requieren la
-- Admin API de Supabase Auth para crear cuentas con contraseña.
-- =====================================================================

-- Categorías de producto
insert into public.categorias (nombre, descripcion) values
  ('Pollo', 'Cortes y presentaciones de pollo'),
  ('Bebidas', 'Refrescos y bebidas embotelladas'),
  ('Complementos', 'Tortillas, salsas y acompañamientos'),
  ('Insumos', 'Carbón, gas, hielo y consumibles operativos'),
  ('Limpieza', 'Productos de limpieza e higiene')
on conflict (nombre) do nothing;

-- Productos base del catálogo
insert into public.productos (nombre, categoria_id, unidad, precio_venta, costo)
select v.nombre, c.id, v.unidad, v.precio_venta, v.costo
from (values
  ('Pollo entero',   'Pollo',         'pieza', 189.00, 120.00),
  ('Medio pollo',    'Pollo',         'pieza', 105.00, 65.00),
  ('Pierna',         'Pollo',         'pieza', 45.00, 28.00),
  ('Muslo',          'Pollo',         'pieza', 40.00, 24.00),
  ('Pechuga',        'Pollo',         'pieza', 60.00, 38.00),
  ('Alitas',         'Pollo',         'kg', 95.00, 60.00),
  ('Refresco 600ml', 'Bebidas',       'pieza', 22.00, 12.00),
  ('Tortillas',      'Complementos',  'kg', 25.00, 15.00),
  ('Salsa verde',    'Complementos',  'litro', 35.00, 18.00),
  ('Salsa roja',     'Complementos',  'litro', 35.00, 18.00),
  ('Carbón',         'Insumos',       'kg', 18.00, 10.00),
  ('Gas LP',         'Insumos',       'kg', 24.00, 16.00),
  ('Hielo',          'Insumos',       'bolsa', 20.00, 10.00),
  ('Jabón desengrasante', 'Limpieza', 'litro', 45.00, 25.00)
) as v (nombre, categoria, unidad, precio_venta, costo)
join public.categorias c on c.nombre = v.categoria
on conflict do nothing;

-- Sucursales demo
insert into public.sucursales (nombre, direccion, telefono, responsable, estado) values
  ('Sucursal Centro', 'Av. Juárez 123, Centro, CDMX', '55-1234-5678', 'María González', 'activa'),
  ('Sucursal Norte',  'Blvd. López Mateos 456, Zona Norte, GDL', '33-2345-6789', 'Carlos Ramírez', 'activa'),
  ('Sucursal Sur',    'Calz. del Valle 789, Zona Sur, MTY', '81-3456-7890', 'Ana Torres', 'activa')
on conflict do nothing;
