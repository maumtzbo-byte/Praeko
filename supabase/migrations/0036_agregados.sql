-- Los agregados que se venden aparte del paquete.
--
-- El agente que contesta comentarios, mensajes y reseñas existe desde hace
-- tiempo y está conectado al webhook de Meta. Contestaba para TODOS los
-- negocios sin verificar nada, o sea que el producto que la página dice que
-- se cobra aparte se estaba regalando — y cada respuesta es una llamada al
-- modelo que alguien paga.
--
-- Hay una razón de negocio además de la obvia: venderle un solo producto a
-- una PyME da 30% de retención a dos años; venderle uno más sube esa
-- retención casi veinte puntos. Este es el segundo producto, y ya estaba
-- construido.
alter table subscriptions
  add column agregado_comentarios boolean not null default false,
  -- El precio del agregado va en la fila y no en una tabla de precios: se
  -- negocia por cliente y el primero que lo compre probablemente pague algo
  -- distinto al décimo. Cuando haya un precio de lista, se mueve.
  add column agregado_comentarios_precio integer;

-- Cuándo se le vendió el primer agregado. Sirve para una sola cosa, y es
-- la que importa: el 62% de los clientes a los que no se les vendió nada
-- en los primeros tres meses se fue antes de dos años. Con esta columna se
-- puede ver quién lleva dos meses y sigue con un solo producto.
alter table subscriptions add column primer_agregado_at timestamptz;
