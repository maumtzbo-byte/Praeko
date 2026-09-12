-- La liga con la que el cliente aprueba su mes sin tener cuenta.
--
-- El panel ya tenía aprobación: el Revisor de Marca marca una pieza como
-- `en_revision` y el dueño le da su visto bueno desde Publicaciones. Eso
-- sirve cuando el dueño del negocio ES el usuario del panel, que era el
-- producto de autoservicio.
--
-- Como agencia no aplica: el cliente no tiene cuenta, no va a crear una
-- para ver doce piezas, y mandárselas por WhatsApp una por una hace
-- imposible saber qué aprobó y qué no. Así que la aprobación tiene que
-- vivir en una URL que se abra sin sesión.
--
-- No es un lujo. La causa número uno por la que un cliente despide a una
-- agencia es la insatisfacción con la entrega (48%, y subiendo), muy por
-- encima del precio. El ciclo de "te lo mando, lo ves, me dices" ES el
-- producto; sin él, cada mes es una discusión por chat.

create table approval_links (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses (id) on delete cascade,

  -- El secreto que hace de llave. Se genera con crypto.randomBytes(32) en
  -- el servidor, no con gen_random_uuid(): un uuid v4 trae 122 bits de
  -- azar y va a acabar pegado en un chat de WhatsApp, reenviado y
  -- guardado en el historial de alguien. 256 bits cuestan lo mismo.
  token text not null unique,

  -- El mes que se manda a aprobar, como rango. Se guarda el rango y no
  -- una lista de piezas para que la liga siga sirviendo si una pieza se
  -- regenera o se agrega después de mandarla: el cliente ve el mes, no
  -- una fotografía congelada de lo que había cuando se creó la liga.
  desde date not null,
  hasta date not null,

  -- Cuándo la abrió por primera vez. Es el dato que convierte "no me ha
  -- contestado" en dos situaciones distintas: no la abrió (hay que
  -- recordarle) o la abrió y no contestó (algo no le gustó y no lo quiere
  -- decir). Sin esto, las dos se ven igual.
  opened_at timestamptz,

  -- Cuándo terminó de revisar todo el mes.
  completed_at timestamptz,

  -- Las ligas caducan. Una URL sin sesión que vive para siempre en un
  -- chat es una fuga que nadie va a cerrar a mano.
  expires_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),

  constraint approval_links_rango_valido check (hasta >= desde)
);

create index approval_links_business_idx on approval_links (business_id, created_at desc);

alter table approval_links enable row level security;

-- Cero políticas, igual que `leads`: RLS activo sin políticas niega todo.
-- La página pública lee y escribe con service-role desde server actions,
-- y SIEMPRE resuelve el business_id a partir del token — nunca lo recibe
-- del cliente. Una política de select abierta a anon dejaría enumerar
-- ligas ajenas contra la API pública.

-- El veredicto del CLIENTE, que es distinto del de la IA.
--
-- `review_result` (0013) es lo que opina el Revisor de Marca, y `status`
-- dice en qué paso del proceso va la pieza — 'generada' es "ya hay
-- archivo", no "ya gustó". Meter la opinión del cliente en cualquiera de
-- los dos volvería ambiguos los dos: una pieza puede estar generada, con
-- el visto bueno de la IA, y aun así el cliente quiere otra cosa.
create type client_verdict as enum ('aprobado', 'cambios');

alter table content_calendar
  add column client_verdict client_verdict,
  add column client_feedback text,
  add column client_reviewed_at timestamptz;

-- Para la cola de "qué me pidieron rehacer" sin recorrer el mes entero.
create index content_calendar_client_verdict_idx
  on content_calendar (business_id, client_verdict)
  where client_verdict is not null;
