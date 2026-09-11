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
