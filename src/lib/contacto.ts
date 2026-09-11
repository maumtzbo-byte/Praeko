/**
 * El WhatsApp del negocio, en un solo lugar.
 *
 * Está escrito en el código y no en una variable de entorno a propósito:
 * es un número comercial que va publicado en la página, no un secreto, y
 * tenerlo aquí evita el problema de que las variables NEXT_PUBLIC_* se
 * incrustan al compilar — agregarla en Vercel después de un despliegue no
 * la aplica hasta el siguiente, y es el tipo de cosa que se depura una
 * hora antes de darse cuenta.
 *
 * Se deja el override por si algún día hay un número por ambiente.
 */
const NUMERO = (process.env.NEXT_PUBLIC_WHATSAPP ?? "528140076185").replace(/\D/g, "");

/** El número tal como se escribe en pantalla, con lada nacional. */
export const WHATSAPP_VISIBLE = "81 4007 6185";

/**
 * Liga de WhatsApp con el mensaje ya escrito.
 *
 * El mensaje prellenado no es adorno: el que llega por un anuncio casi
 * nunca sabe cómo empezar, y un chat en blanco es donde se cae la mitad
 * de los prospectos. Además, si el texto dice de dónde viene, sabes
 * responder sin preguntar.
 */
export function ligaWhatsapp(mensaje: string): string {
  return `https://wa.me/${NUMERO}?text=${encodeURIComponent(mensaje)}`;
}

export const MENSAJE_COTIZACION =
  "Hola, vengo de su página y quiero una cotización para las redes de mi negocio.";

export const MENSAJE_MUESTRA =
  "Hola, vi su anuncio y quiero las 3 piezas de muestra para mi negocio.";

/** El canal de soporte y de avisos legales.
 *
 *  Durante mucho tiempo la página, el aviso de privacidad y los términos
 *  mandaban a `soporte@frames.com`, que es un dominio que no es nuestro:
 *  el sitio vive en praekomarketingsaas.vercel.app. O sea que el correo
 *  donde se ejercen los derechos ARCO llegaba, con suerte, al buzón de un
 *  desconocido. WhatsApp no es el canal más formal para un aviso de
 *  privacidad, pero es el único que de verdad contestamos, y la ley pide
 *  un medio real de contacto, no uno que se vea bien. */
export const MENSAJE_SOPORTE = "Hola, tengo una duda sobre mi servicio de Frames.";

export const MENSAJE_DATOS =
  "Hola, quiero ejercer mis derechos sobre los datos que tienen de mí (ARCO).";
