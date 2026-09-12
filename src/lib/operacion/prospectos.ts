import { normalizaWhatsapp } from "@/lib/validation/lead";

/** Los estados por los que pasa un prospecto. Es la misma lista que el
 *  CHECK de la tabla (ver 0025_leads.sql); duplicarla aquí permite que
 *  TypeScript rechace un estado inventado antes de que la base lo haga.
 *
 *  Vive en este archivo y no junto a las server actions porque un módulo
 *  "use server" solo puede exportar funciones async: sacar de ahí una
 *  constante rompe la compilación. Y de todos modos la pantalla necesita
 *  las etiquetas, que no son una acción de servidor. */
export const ESTADOS = [
  "nuevo",
  "muestra_enviada",
  "en_conversacion",
  "cliente",
  "perdido",
] as const;

export type Estado = (typeof ESTADOS)[number];

/** El estado como se lee en pantalla. En la base van con guion bajo
 *  porque son valores, no texto. */
export const ETIQUETA_DE_ESTADO: Record<Estado, string> = {
  nuevo: "Nuevo",
  muestra_enviada: "Muestra enviada",
  en_conversacion: "En conversación",
  cliente: "Cliente",
  perdido: "Perdido",
};

/** El color del estado. `nuevo` va en ámbar y no en gris a propósito: es
 *  el único estado que pide una acción hoy, y la pantalla existe justo
 *  para que esa acción no se le pase a nadie. */
export const TONO_DE_ESTADO: Record<Estado, "neutral" | "success" | "warning" | "danger"> = {
  nuevo: "warning",
  muestra_enviada: "neutral",
  en_conversacion: "neutral",
  cliente: "success",
  perdido: "danger",
};

export function esEstado(valor: string): valor is Estado {
  return (ESTADOS as readonly string[]).includes(valor);
}

/**
 * Liga para escribirle AL PROSPECTO por WhatsApp, con el mensaje ya
 * escrito.
 *
 * Es la contraparte de `ligaWhatsapp` de src/lib/contacto.ts, que abre un
 * chat con NUESTRO número para que el prospecto nos escriba. Aquí va al
 * revés y por eso no se reutiliza aquella: el número es el de él.
 *
 * El mensaje prellenado no es adorno. Es la diferencia entre contestar un
 * prospecto en diez segundos y dejarlo enfriándose mientras uno decide
 * cómo abrir la conversación, y trae el nombre de la marca porque es lo
 * que hace que no se lea como un mensaje masivo.
 */
export function ligaAlProspecto(whatsapp: string, nombre: string, negocio: string): string | null {
  const digitos = normalizaWhatsapp(whatsapp);
  if (digitos.length !== 10) return null;

  const primerNombre = nombre.trim().split(/\s+/)[0] ?? "";
  const mensaje =
    `Hola ${primerNombre}, soy de Frames. Vi que pediste las piezas de ` +
    `muestra para ${negocio.trim()} y ya me puse a trabajar en ellas.`;

  return `https://wa.me/52${digitos}?text=${encodeURIComponent(mensaje)}`;
}
