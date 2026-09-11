-- Prospectos que piden la muestra gratis desde /prueba.
--
-- Esta tabla existe porque el embudo cambió: la landing ya no manda a
-- registrarse solo (no se puede entregar autoservicio mientras la cuenta
-- de desarrollador de Meta esté bloqueada, y de todos modos un servicio
-- se vende hablando). Ahora la página captura lo mínimo para poder
-- generarle una muestra al prospecto y contactarlo.
--
-- Cuatro campos y nada más, a propósito: cada campo extra en un
-- formulario de anuncio cuesta prospectos, y estos cuatro alcanzan para
-- producir tres piezas y devolver la llamada.
create table leads (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  negocio text not null,
  giro text not null,
  whatsapp text not null,
  -- Opcional pero se pide: con ver su cuenta ya se sabe con qué material
  -- se trabaja y qué tan mal está su contenido actual, que es justo el
  -- argumento de venta.
  instagram text,
  -- De dónde llegó. Se llena desde el parámetro `origen` de la URL, para
  -- poder distinguir el tráfico de cada anuncio sin depender del pixel.
  origen text,
  -- Dónde va en el proceso de venta. Se mueve a mano; no hay CRM y no
  -- hace falta uno con diez prospectos.
  estado text not null default 'nuevo'
    check (estado in ('nuevo', 'muestra_enviada', 'en_conversacion', 'cliente', 'perdido')),
  notas text,
  created_at timestamptz not null default now()
);

-- El único acceso real es "dame los prospectos nuevos primero".
create index leads_created_at_idx on leads (created_at desc);
create index leads_estado_idx on leads (estado, created_at desc);

alter table leads enable row level security;

-- Sin políticas de select/insert para usuarios finales, y es deliberado:
-- RLS activo sin políticas niega todo. El formulario público escribe con
-- el cliente de service-role desde una server action (que valida los
-- datos antes), y los prospectos se leen desde el panel de Supabase.
--
-- La alternativa —una política de insert abierta a anon— dejaría que
-- cualquiera escribiera filas directo contra la API pública sin pasar por
-- la validación ni por el límite de frecuencia. Con un formulario que
-- vive detrás de anuncios pagados, eso es una invitación a que te lo
-- llenen de basura.
