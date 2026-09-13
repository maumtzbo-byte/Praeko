-- Las piezas de muestra que se producen para convencer a un prospecto.
--
-- Hasta ahora todo el sistema de generación asume un CLIENTE: cuelga de un
-- negocio, de una suscripción y de un cupo mensual. Eso deja fuera el
-- movimiento que abre el embudo — hacerle una pieza con su propio producto
-- a una marca que todavía no contrata, para mandársela por mensaje.
--
-- Por eso la muestra vive en su propia tabla y no en `generations`. No es
-- entrega, es gasto de venta: no consume cupo de nadie, no pertenece a un
-- negocio, y su costo hay que poder separarlo del costo de producción para
-- que el margen de los paquetes siga significando algo.

-- El prospecto que se agrega a mano desde Instagram no tiene teléfono, y
-- pedírselo a la columna vuelve imposible registrarlo. El número llega
-- después, cuando contesta.
alter table leads alter column whatsapp drop not null;

create table muestras (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads(id) on delete cascade,

  -- El estilo con el que se pidió, de src/lib/marketing/estilos.ts.
  estilo text,
  -- Lo que se le mandó al generador, tal cual. Se guarda porque cuando una
  -- muestra sale bien hay que poder repetir exactamente esa instrucción, y
  -- reconstruirla después de los cambios del catálogo es imposible.
  prompt text not null,

  proveedor text not null,
  provider_job_id text,
  job_status text not null default 'queued'
    check (job_status in ('queued', 'processing', 'completed', 'failed')),
  -- La URL que devuelve fal.ai. Caduca; para conservar una muestra hay que
  -- descargarla, y por eso la pantalla la ofrece de inmediato.
  url text,

  -- Lo que costó. Es el costo de adquirir un cliente y merece su propia
  -- columna: sin esto, el gasto de prospección se mezclaría con el de
  -- producción y ninguno de los dos se podría leer.
  costo_usd numeric not null default 0,
  segundos integer,

  created_at timestamptz not null default now()
);

create index muestras_lead_idx on muestras (lead_id, created_at desc);
create index muestras_created_at_idx on muestras (created_at desc);

alter table muestras enable row level security;

-- Cero políticas, igual que `leads`: RLS activo sin políticas niega todo.
-- Escribe y lee el service-role desde /prospectos, detrás de `esOperador`.
