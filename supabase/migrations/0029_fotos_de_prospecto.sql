-- Las fotos que el prospecto sube desde /prueba, y su sitio web.
--
-- Hasta ahora el paso 2 del formulario preguntaba "dónde están tus fotos"
-- como texto libre. Servía para que una persona lo leyera y fuera a
-- buscarlas a mano. No sirve como insumo de un programa, y sin un insumo
-- que el programa pueda agarrar no hay forma de generar la muestra sola.
--
-- Esta es esa pieza. Sirve igual para hacerlo a mano hoy —tener la foto
-- adjunta en vez de un link pegado ahorra la mitad del trabajo— y es lo
-- que la generación automática va a necesitar después.

-- Cubeta propia y NO la de `brand-assets`.
--
-- Aquella tiene políticas `to authenticated` que resuelven la membresía a
-- un negocio; un prospecto de /prueba no tiene sesión, no tiene negocio y
-- nunca va a tenerlos hasta que contrate. Meterlo ahí obligaría a aflojar
-- las políticas de la cubeta donde viven los archivos de los clientes que
-- sí pagan, que es exactamente el tipo de atajo que después se olvida.
--
-- El límite de tamaño y los tipos permitidos se declaran aquí y no en el
-- código del navegador: una validación en el cliente la brinca cualquiera
-- con la consola abierta, y esta cubeta acepta escrituras desde una URL
-- firmada que se le entrega a alguien sin sesión.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fotos-prospecto',
  'fotos-prospecto',
  false,
  10485760, -- 10 MB. Una foto de producto de celular pesa 2-4.
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Cero políticas, igual que la tabla `leads`: RLS activo sin políticas
-- niega todo. La subida ocurre con una URL firmada que emite una server
-- action —y esa action valida el lead y cuenta cuántas fotos lleva antes
-- de emitirla—, y la lectura la hace el service-role cuando se produce la
-- muestra. Nadie más toca estos archivos.

alter table leads
  -- Opcional. Un buen porcentaje de las marcas chicas vende solo por
  -- Instagram y no tiene sitio, así que pedirlo obligatorio costaría
  -- prospectos a cambio de un campo vacío.
  add column sitio_web text,
  -- Las rutas dentro de la cubeta, en orden de subida. Arreglo y no tabla
  -- aparte porque son tres o cuatro por prospecto y nunca se consultan por
  -- separado: o se traen todas para generar la muestra, o ninguna.
  add column fotos text[] not null default '{}';
