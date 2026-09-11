import { z } from "zod";

/** Los giros que se ofrecen en el formulario de /prueba.
 *
 *  Es la misma lista que el cuestionario de onboarding (INDUSTRY_OPTIONS)
 *  menos las opciones que describen un rol y no un negocio con redes que
 *  atender. "Agencia de marketing" sale porque una agencia no es cliente
 *  de otra agencia, y "Dueño de negocio" sale porque no dice a qué se
 *  dedica, que es justo el dato que hace falta para generarle la muestra. */
export const GIROS_PROSPECTO = [
  "Restaurante o cafetería",
  "Gimnasio o estudio boutique",
  "Belleza y estética",
  "Salud y bienestar",
  "Retail o tienda",
  "E-commerce",
  "Asesor inmobiliario",
  "Servicios profesionales",
  "Educación",
  "Otro",
] as const;

/** Diez dígitos, que es un celular mexicano. Se acepta con espacios,
 *  guiones, paréntesis y con o sin +52 porque la gente lo escribe de las
 *  seis formas, y rebotar un prospecto por un guion sería tirar dinero de
 *  publicidad a la basura. La normalización vive en `normalizaWhatsapp`. */
const whatsapp = z
  .string()
  .trim()
  .min(1, "Escribe tu WhatsApp.")
  .refine((v) => normalizaWhatsapp(v).length === 10, "Escribe tu WhatsApp a 10 dígitos.");

export function normalizaWhatsapp(valor: string): string {
  const digitos = valor.replace(/\D/g, "");
  // 52 al inicio con 12 dígitos es el lada de México escrito completo;
  // 521 con 13 es la forma vieja que todavía copia y pega mucha gente.
  if (digitos.length === 13 && digitos.startsWith("521")) return digitos.slice(3);
  if (digitos.length === 12 && digitos.startsWith("52")) return digitos.slice(2);
  return digitos;
}

/** Se guarda sin arroba ni URL: la gente escribe "@negocio",
 *  "instagram.com/negocio" y "negocio" por igual, y guardarlo de tres
 *  formas distintas vuelve imposible buscarlo después. */
export function normalizaInstagram(valor: string): string | null {
  const limpio = valor
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/.*$/, "")
    .trim();
  return limpio.length > 0 ? limpio : null;
}

/** Paso 1: lo mínimo para tener al prospecto. Se manda solo, y en cuanto
 *  llega el prospecto ya está a salvo en la base aunque abandone el resto. */
export const leadSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre."),
  negocio: z.string().trim().min(2, "Escribe el nombre de tu negocio."),
  giro: z.enum(GIROS_PROSPECTO, { message: "Elige a qué se dedica tu negocio." }),
  whatsapp,
  origen: z.string().trim().max(60).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

/** Paso 2: el contexto que la IA de verdad necesita.
 *
 *  Con nombre, negocio y giro, el agente de estrategia puede escribir
 *  "contenido para un gimnasio" y nada más — o sea, una muestra genérica,
 *  que no vende. Estos cuatro campos son los que la hacen específica:
 *
 *    · qué vende, en sus palabras, es de dónde sale de qué escribir;
 *    · la ciudad la necesita el agente de Tendencias, que busca en
 *      internet qué funciona "en tu giro, en tu ciudad";
 *    · lo que más le preguntan sus clientes es la mina de oro del
 *      contenido, porque cada pregunta repetida es una pieza;
 *    · el Instagram vale más que los tres juntos: con verlo se saca su
 *      tono, sus fotos y qué tan mal está su contenido actual.
 *
 *  Todos opcionales, y va aparte del paso 1 a propósito: un formulario de
 *  ocho campos en una página detrás de anuncios pagados espanta
 *  prospectos, y perder el prospecto es peor que tener poca información. */
export const contextoSchema = z.object({
  leadId: z.string().uuid(),
  vende: z.string().trim().max(300).optional(),
  ciudad: z.string().trim().max(80).optional(),
  preguntan: z.string().trim().max(300).optional(),
  instagram: z.string().trim().max(120).optional(),
});

export type ContextoInput = z.infer<typeof contextoSchema>;
