-- Quién se va por el botón de WhatsApp sin llenar el formulario.
--
-- La landing tiene dos salidas y solo una deja rastro. El que llena el
-- formulario de /prueba queda en `leads`. El que le da a "pide tu
-- cotización por WhatsApp" se va a un chat y no existe en ningún lado: no
-- se sabe cuántos son, ni de qué anuncio venían, ni cuántos de ellos
-- llegaron de verdad a escribir.
--
-- Eso es justo el número que decide si un anuncio sirve. Un anuncio puede
-- traer cero registros y veinte conversaciones, y hoy se leería como un
-- anuncio fallido.
--
-- No se guarda nada de la persona. Un clic no trae nombre ni teléfono, y
-- aunque se pudiera sacar algo del navegador no se haría: para eso está el
-- formulario, donde el prospecto sí da su dato sabiendo que lo da. Esto es
-- un contador con contexto, no un perfil.
create table whatsapp_exits (
  id uuid primary key default gen_random_uuid(),
  -- Cuál de los botones. La lista es corta a propósito: si mañana hay un
  -- tercer botón, se agrega aquí y se ve cuál jala.
  boton text not null check (boton in ('muestra', 'cotizacion')),
  -- De qué anuncio venía, del parámetro `origen` de la URL. Es la columna
  -- que le da sentido a la tabla.
  origen text,
  -- De qué página salió. Distingue el botón de precios del de /prueba
  -- aunque los dos manden el mismo mensaje.
  ruta text,
  created_at timestamptz not null default now()
);

create index whatsapp_exits_created_at_idx on whatsapp_exits (created_at desc);

alter table whatsapp_exits enable row level security;

-- Cero políticas, igual que `leads`: RLS activo sin políticas niega todo.
-- Se escribe con service-role desde una server action que valida el botón
-- contra la lista de arriba, y se lee desde /prospectos.
