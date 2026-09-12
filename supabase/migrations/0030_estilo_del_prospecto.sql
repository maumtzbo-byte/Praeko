-- El estilo visual que el prospecto eligió para su marca.
--
-- "¿Qué tono quieres?" es una pregunta imposible para alguien que no es
-- diseñador, y la respuesta que da —"profesional pero cercano"— no le
-- sirve a quien va a producir. Señalar dos o tres estilos de una lista, en
-- cambio, lo hace cualquiera, y cada uno tiene detrás una instrucción
-- concreta para el generador (ver src/lib/marketing/estilos.ts).
--
-- Arreglo de ids y no texto libre: el valor de este campo es que se pueda
-- traducir a una instrucción sin que nadie lo interprete en el camino. Se
-- esperan de uno a tres; una marca casi nunca cabe en una sola dirección.
alter table leads
  add column estilos text[] not null default '{}';
