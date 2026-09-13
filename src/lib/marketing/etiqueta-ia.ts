/**
 * Lo que hay que decir sobre la etiqueta de IA de Meta, en un solo lugar.
 *
 * Meta lee los metadatos C2PA e IPTC que los generadores incrustan en el
 * archivo y aplica la etiqueta "AI info" SIN revisión humana. También
 * tiene clasificadores que lo deducen de la imagen misma. O sea: las
 * piezas que entregamos pueden salir etiquetadas en el Instagram del
 * cliente, y no lo controlamos nosotros.
 *
 * La parte tranquilizadora, y es la que importa: para publicaciones
 * orgánicas con esa etiqueta, Meta dice que NO reduce el alcance. Las
 * penalizaciones fuertes —hasta 80% menos distribución— son para contenido
 * juzgado engañoso, definido como media realista que muestra hechos que no
 * ocurrieron. Una foto de producto en una mesa de mármol no cae ahí.
 *
 * Lo que sí obliga: en ANUNCIOS la declaración es obligatoria desde la
 * actualización de políticas de 2026, y Meta advierte que puede penalizar
 * si no se hace.
 *
 * Por qué vive en su propio archivo: esto se dice en tres lugares con
 * públicos distintos —las preguntas de la portada, los términos, y el
 * panel de quien va a publicar— y las tres tienen que decir lo mismo. Una
 * política de plataforma contada de tres maneras distintas es peor que no
 * contarla.
 */

/** Para el prospecto que todavía no compra. Va en las preguntas
 *  frecuentes: es mejor que se entere aquí, gratis, que el día que vea la
 *  etiqueta en su propio perfil. */
export const AVISO_ETIQUETA_PUBLICO =
  "Es probable que sí. Instagram y Facebook leen unas marcas invisibles que los generadores dejan en el archivo, y ponen una etiqueta de «Información de IA» sin que nadie la revise. No la controlamos ni nosotros ni tú. La buena noticia es que en publicaciones normales Meta dice que esa etiqueta no reduce el alcance — las penalizaciones son para contenido que engaña, como mostrar hechos que no pasaron, y una foto de tu producto sobre una mesa no es eso. Si vas a pautar, ahí sí hay que declararlo, y de eso nos encargamos nosotros.";

/** Para el panel, junto al botón de publicar. Corto: quien está aquí ya
 *  contrató y solo necesita el recordatorio operativo. */
export const AVISO_ETIQUETA_PANEL =
  "Meta puede marcar estas piezas con su etiqueta de «Información de IA». En publicaciones normales no baja el alcance. Si el cliente las va a pautar, hay que declararlo en el anuncio.";

/**
 * Lo que hay que decirle al cliente antes de producirle contenido con una
 * persona en cámara.
 *
 * Va aparte del aviso de la etiqueta de IA porque es otra cosa. Aquella
 * dice que la FOTO de su producto se generó; esta dice que hay una PERSONA
 * que no existe recomendando lo que él vende. La segunda es más fuerte, la
 * van a notar sus seguidores, y le van a preguntar a él y no a nosotros.
 *
 * Se enseña antes del visto bueno, una sola vez, y sin ese visto bueno no
 * se produce nada con portavoz (ver brand_profiles.portavoz_aceptado_at).
 */
export const AVISO_DE_PORTAVOZ =
  "El portavoz es una persona generada: no existe, no probó tu producto y no es una clienta real. Es un recurso de producción, como un actor en un comercial — pero conviene que lo sepas de nuestra boca y no de la de un seguidor. Instagram y Facebook van a etiquetar estas piezas con «Información de IA» igual que las demás. Si alguien pregunta, la respuesta corta que funciona es la verdad: «es una presentadora generada, el producto y lo que dice de él sí son reales». Lo que nunca vamos a hacer es ponerle palabras de clienta satisfecha ni afirmaciones sobre resultados que tú no nos hayas dado.";
