-- El formato de portavoz: alguien sosteniendo el producto y hablando de él.
--
-- Es el formato que más convierte en producto empacado, y el modelo que
-- hace falta ya se paga: Seedance 2.0 hace sincronía de labios a nivel de
-- fonema en más de ocho idiomas, y Kling también genera diálogo en español.
-- Lo que faltaba no era capacidad, era poder pedirlo.
--
-- Nota sobre el enum: en Postgres, un valor agregado con ALTER TYPE no se
-- puede USAR en la misma transacción que lo agrega. Aquí solo se agrega;
-- las filas que lo usen vienen después, en otra corrida.
alter type content_format add value if not exists 'portavoz';

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
