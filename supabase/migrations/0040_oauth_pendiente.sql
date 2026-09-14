-- Los tokens de OAuth dejan de dar la vuelta por el navegador.
--
-- El callback de /social/<red>/callback guardaba el arreglo COMPLETO de
-- cuentas conectables —incluyendo el access_token de larga vida de la
-- página de Meta y el refresh_token de Google— dentro de una cookie
-- (social_oauth_pending) que viaja al navegador del usuario y se queda 10
-- minutos en su cookie jar. Era el único lugar de todo el código donde un
-- token escapaba del servidor: el resto vive en social_connection_tokens,
-- que tiene RLS deny-all. La cookie es httpOnly (JS no la lee, así que un
-- XSS no la roba directo), pero un bearer token de larga vida no tiene por
-- qué estar del lado del cliente ni un segundo.
--
-- Esta tabla es el escondite del lado del servidor: el callback mete aquí
-- las cuentas, la cookie se queda SOLO con este id aleatorio, y la pantalla
-- de elegir cuenta y la acción de confirmar leen de aquí. Deny-all como
-- leads y approval_links — únicamente el service-role la toca.
create table if not exists social_oauth_pending (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  platform text not null,
  -- Incluye los tokens. Nunca sale del servidor. Se borra al confirmar.
  accounts jsonb not null,
  created_at timestamptz not null default now(),
  -- Misma ventana que tenía la cookie. Una fila más vieja que esto se
  -- ignora al leer y se borra; no hay cron, así que la limpieza es
  -- oportunista, y son datos de un flujo que ya se abandonó.
  expires_at timestamptz not null default (now() + interval '10 minutes')
);

create index if not exists social_oauth_pending_expira
  on social_oauth_pending (expires_at);

alter table social_oauth_pending enable row level security;
-- Cero políticas a propósito: deny-all. Solo el service-role escribe y lee.
