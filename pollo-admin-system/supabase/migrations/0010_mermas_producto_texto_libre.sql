-- El producto de una merma ahora se escribe directamente en vez de buscarse
-- en un catálogo: hay demasiados productos y buscar era un estorbo.
alter table mermas add column producto_nombre text;
alter table mermas alter column producto_id drop not null;
alter table mermas add constraint mermas_producto_check check (producto_id is not null or producto_nombre is not null);
