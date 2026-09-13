-- El historial de cómo le fue a cada publicación.
--
-- Hasta ahora los resultados se pedían EN VIVO a Meta cada vez que alguien
-- abría el panel, y no se guardaban. Eso tiene tres consecuencias que
-- parecen distintas y son la misma:
--
--   · No se le puede decir al agente de estrategia qué funcionó el mes
--     pasado, porque "el mes pasado" no existe en ningún lado.
--   · No se puede calcular a qué hora responde mejor la audiencia de un
--     cliente, aunque el paquete Crecimiento lo venda.
--   · No se le puede enseñar al cliente cómo va contra el mes anterior,
--     que es el dato que más retiene.
--
-- Guardar también protege de algo concreto: Meta retira métricas cada
-- tanto —varias de Instagram, "impressions" entre ellas, se fueron en
-- 2025— y una vez retirada, el dato histórico se pierde para siempre si
-- nunca se copió.

-- Cuándo se publicó DE VERDAD. `scheduled_date` es una fecha sin hora y es
-- cuándo se planeó; para saber a qué hora responde mejor la audiencia hace
-- falta la hora en que salió.
alter table content_calendar add column published_at timestamptz;

create table post_insights (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,
  content_calendar_id uuid not null references content_calendar(id) on delete cascade,
  platform social_platform not null,

  -- Todas anulables a propósito, igual que en PostInsights: una métrica que
  -- la plataforma no devolvió significa "no se sabe", no "cero".
  impressions integer,
  likes integer,
  comments integer,
  shares integer,

  -- Cuántas horas llevaba publicada la pieza cuando se midió.
  --
  -- Es la columna que hace comparable el historial. El engagement se
  -- acumula por días: una pieza medida a las dos horas SIEMPRE se ve peor
  -- que una medida a los siete días, aunque haya funcionado mejor. Sin
  -- esto, el agente aprendería a preferir las piezas viejas.
  horas_publicada integer not null,

  medido_at timestamptz not null default now(),

  -- El día de la medición, como columna real y no como expresión en el
  -- índice. Dos razones, las dos descubiertas al correr esto de verdad:
  --
  --   · Postgres rechaza `medido_at::date` dentro de un índice porque el
  --     cast de timestamptz a date depende de la zona horaria de la
  --     sesión, o sea que no es IMMUTABLE. Anclarlo a UTC sí lo es.
  --   · Una restricción única sobre una EXPRESIÓN no se puede nombrar
  --     desde un upsert por lista de columnas, que es justo como la usa
  --     el código que mide. Con la columna de verdad, el upsert funciona
  --     como se lee.
  medido_dia date generated always as ((medido_at at time zone 'UTC')::date) stored
);

-- Una medición por pieza por día. Medir dos veces el mismo día no agrega
-- información y sí ensucia los promedios.
alter table post_insights
  add constraint post_insights_una_por_dia unique (content_calendar_id, medido_dia);

create index post_insights_negocio_idx on post_insights (business_id, medido_at desc);

alter table post_insights enable row level security;

-- El cliente puede ver los resultados de SU negocio: son suyos y el panel
-- se los enseña. La escritura la hace el service-role al medir.
create policy post_insights_select on post_insights
  for select to authenticated
  using (is_business_member(business_id));
