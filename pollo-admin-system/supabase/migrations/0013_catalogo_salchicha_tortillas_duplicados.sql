-- Nuevo producto: Salchicha por pieza (distinto de "Salchicha asar" en kg,
-- que es el insumo crudo). Va en Complementos, junto con Totopos/Tortillas.
insert into productos (nombre, categoria_id, unidad, precio_venta, costo, activo)
select 'Salchicha', c.id, 'pieza', 0, 0, true
from categorias c
where c.nombre = 'Complementos'
  and not exists (select 1 from productos p where p.nombre = 'Salchicha' and p.categoria_id = c.id);

-- Reactivar Tortillas y pasarla de kg a pieza (se cuenta "1 tortilla", no peso).
update productos set activo = true, unidad = 'pieza' where nombre = 'Tortillas';

-- Desactivar los duplicados de Insumos: se usan los de Complementos (Cebollas, Jalapeños).
update productos p set activo = false
from categorias c
where p.categoria_id = c.id and c.nombre = 'Insumos' and p.nombre in ('Cebolla', 'Chile jalapeño');
