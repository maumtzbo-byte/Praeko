-- Los mensajes que entrega el webhook de WhatsApp.
--
-- El webhook no manda conversaciones, manda mensajes sueltos. Pasarle un
-- mensaje suelto al extractor de prospectos no sirve: la mitad son "Hola"
-- y el contexto que hace falta —qué vende, de dónde es, qué le preguntan—
-- aparece repartido en diez mensajes. Por eso primero se guardan y el
-- agente se corre después sobre el hilo completo.
--
-- Guardarlos además vuelve el webhook trivial: recibe, valida la firma,
-- inserta y contesta. Sin llamadas a un modelo adentro, que es lo que
-- haría que Meta viera timeouts y empezara a reintentar en cascada.
create table whatsapp_messages (
  id uuid primary key default gen_random_uuid(),

  -- El id que le pone Meta al mensaje. UNIQUE y esa es toda la estrategia
  -- de idempotencia: Meta REINTENTA los webhooks cuando no recibe un 200 a
  -- tiempo, así que el mismo mensaje va a llegar dos veces tarde o
  -- temprano. Sin esta restricción, la conversación que lee el agente
  -- tendría renglones repetidos y el resumen saldría torcido.
  wam_id text not null unique,

  -- El teléfono como lo manda Meta (con lada: 5218112345678).
  wa_id text not null,
  -- El mismo, normalizado a 10 dígitos. Existe para poder juntar con
  -- `leads.whatsapp`, que guarda 10 dígitos desde el formulario. Se
  -- calcula al insertar y no en cada consulta.
  telefono text not null,

  -- El nombre que la persona tiene puesto en su WhatsApp. No es su nombre
  -- real necesariamente, pero para abrir una conversación sirve.
  nombre_perfil text,

  -- true = lo escribió él. false = es el eco de lo que tú contestaste
  -- desde la app (webhook `smb_message_echoes` de Coexistence). Los dos se
  -- guardan: sin tus respuestas, el hilo no se entiende.
  entrante boolean not null,

  -- Qué tipo de mensaje. Solo se guarda el texto de los de texto; de una
  -- foto o un audio queda el tipo para que el hilo no tenga hoyos mudos.
  tipo text not null,
  texto text,

  enviado_at timestamptz not null,
  created_at timestamptz not null default now()
);

-- El único acceso real: "dame el hilo de este teléfono, en orden".
create index whatsapp_messages_telefono_idx on whatsapp_messages (telefono, enviado_at);

alter table whatsapp_messages enable row level security;

-- Cero políticas, igual que `leads`: RLS activo sin políticas niega todo.
-- Escribe el webhook con service-role después de validar la firma de Meta,
-- y lee /prospectos. Nadie más toca esto.
