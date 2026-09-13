-- El resultado de mirar la pieza generada.
--
-- `generations.quality_review_result` ya existía con su enum
-- (aprobado / necesita_revision_humana / rechazado) desde la migración
-- inicial, y NADA la escribía: era una columna muerta. La revisión de
-- marca que sí corre lee el guion, no la imagen, así que el veredicto
-- visual nunca tuvo quién lo produjera.
--
-- Ahora lo produce el revisor visual (src/lib/agents/revisor-visual.ts).
-- Faltaban dos cosas para que el veredicto sirviera de algo: QUÉ está mal,
-- porque "rechazado" sin motivo obliga a volver a mirar la pieza completa
-- y ahí se pierde el ahorro de tiempo; y si el producto de la pieza es el
-- del cliente, que es el error más caro y va aparte porque es el único que
-- amerita tirar la pieza sin discusión.
alter table generations
  -- Concretos y ubicados: "la mano derecha que sostiene el frasco tiene
  -- cuatro dedos". Vacío cuando está aprobada.
  add column revision_problemas text[] not null default '{}',
  -- null = no se pudo comparar porque no había foto de referencia.
  add column mismo_producto boolean,
  -- Cuándo se revisó. Distingue "aprobada" de "todavía no se mira", que
  -- con la columna del veredicto en null se leían igual.
  add column revisada_at timestamptz;
