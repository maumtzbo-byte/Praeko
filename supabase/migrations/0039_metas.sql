-- Qué acordaron que iba a contar como que esto funcionó.
--
-- El churn más caro no es el del cliente al que le fue mal: es el del que
-- esperaba algo que nunca se acordó. Se va convencido de que no cumpliste
-- y tú convencido de que sí, y los dos tienen razón porque nadie escribió
-- qué era cumplir. Las agencias que fijan metas realistas durante el alta
-- retienen de 15 a 20 puntos porcentuales más que el promedio.
--
-- Va en su propia tabla y no como columna de `brand_profiles` porque una
-- meta tiene historia: se fija, se mide, se cumple o no, y se vuelve a
-- fijar. Una columna solo guarda la última y pierde justo lo que sirve
-- para la conversación de renovación.
create table metas (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references businesses(id) on delete cascade,

  -- Escrita en las palabras del cliente, no en las nuestras. "Que me
  -- pregunten más por DM" es una meta mejor que "aumentar engagement 20%":
  -- la primera la reconoce él cuando pasa.
  texto text not null,

  -- Qué métrica la representa, cuando se puede. Nula a propósito: hay metas
  -- reales que no se miden desde aquí ("que me inviten a la expo") y
  -- forzarlas a un número las convertiría en otra cosa.
  metrica text check (metrica in ('alcance', 'interacciones', 'seguidores', 'mensajes')),
  valor_inicial integer,
  valor_objetivo integer,

  -- Para cuándo. Una meta sin fecha no se puede incumplir, que suena bien
  -- y es justo el problema: tampoco se puede cumplir.
  para_fecha date,

  cumplida_at timestamptz,
  created_at timestamptz not null default now()
);

create index metas_negocio_idx on metas (business_id, created_at desc);

alter table metas enable row level security;

-- El cliente ve y acuerda sus propias metas: se escriben con él.
create policy metas_select on metas
  for select to authenticated using (is_business_member(business_id));
