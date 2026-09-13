-- Las columnas del portavoz.
--
-- Van en su propia migración y no junto al ALTER TYPE de 0037 por una
-- regla de Postgres: un valor de enum agregado con ALTER TYPE no se puede
-- USAR en la misma transacción que lo agrega. Aquí no se usa, así que
-- juntas probablemente funcionarían — pero "probablemente" no es una buena
-- propiedad para una migración, y separarlas cuesta nada.

alter table brand_profiles
  -- Cómo es la persona que representa a esta marca.
  --
  -- Esta columna es la diferencia entre un portavoz y un extra. Sin ella,
  -- cada pieza saldría con una persona distinta: doce videos al mes con
  -- doce caras diferentes se ven peor que cero videos con personas, porque
  -- delatan que nadie está atrás. Guardar la descripción y repetirla en
  -- cada generación hace que sea LA MISMA persona mes con mes, que es lo
  -- que convierte un recurso en un personaje de marca.
  add column portavoz text,

  -- Si el dueño ya vio y aceptó que la persona es generada.
  --
  -- No es burocracia. Meta etiqueta estas piezas solo, el cliente lo va a
  -- ver en su propio perfil, y sus seguidores le van a preguntar. Que se
  -- entere aquí, antes de la primera pieza, es mucho más barato que el día
  -- que alguien se lo pregunte en los comentarios. Sin este visto bueno no
  -- se produce contenido con portavoz.
  add column portavoz_aceptado_at timestamptz;
