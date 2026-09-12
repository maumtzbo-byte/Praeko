import { z } from "zod";

/** Las categorías de producto que se ofrecen en el formulario de /prueba.
 *
 *  Eran los diez giros del cuestionario de onboarding —restaurante,
 *  gimnasio, inmobiliaria— y dejaron de servir cuando el cliente pasó a ser
 *  una marca de producto empacado: un restaurante no tiene un frasco que
 *  meter como referencia, y preguntarle "¿a qué se dedica?" no dice nada de
 *  lo único que necesitamos saber, que es qué objeto vamos a fotografiar.
 *
 *  La lista es la del filtro real: forma rígida, que la foto de referencia
 *  conserva. Ropa y calzado NO están, y su ausencia es la respuesta — la
 *  tela cae distinto en cada toma y ahí la generación se delata. "Otro" se
 *  queda para no rebotar a una marca que sí encaja y no se ve en la lista. */
export const CATEGORIAS_PRODUCTO = [
  "Skincare y cosmética",
  "Café de especialidad",
  "Tés e infusiones",
  "Salsas, mieles y conservas",
  "Suplementos y vitaminas",
  "Velas y aromas para el hogar",
  "Cuidado del cabello",
  "Perfumes",
  "Joyería y accesorios",
  "Otro producto empacado",
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
 *  llega el prospecto ya está a salvo en la base aunque abandone el resto.
 *
 *  `giro` conserva el nombre de la columna aunque ahora guarde una categoría
 *  de producto: renombrarla obligaría a una migración y a tocar el panel,
 *  y el dato que lleva adentro es el mismo tipo de cosa. */
export const leadSchema = z.object({
  nombre: z.string().trim().min(2, "Escribe tu nombre."),
  negocio: z.string().trim().min(2, "Escribe el nombre de tu marca."),
  giro: z.enum(CATEGORIAS_PRODUCTO, { message: "Elige qué tipo de producto vendes." }),
  whatsapp,
  origen: z.string().trim().max(60).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

/** Paso 2: el contexto que la IA de verdad necesita.
 *
 *  Con nombre, marca y categoría, el agente de estrategia puede escribir
 *  "contenido para una marca de skincare" y nada más — o sea, una muestra
 *  genérica, que no vende. Estos cuatro campos son los que la hacen
 *  específica, y son distintos a los de antes porque el cliente es otro:
 *
 *    · qué producto quiere que usemos y dónde están sus fotos, en un solo
 *      campo, porque de ahí sale la referencia y sin ella no hay pieza. Van
 *      juntos a propósito: separarlos pedía una columna nueva, o sea una
 *      migración más en la cola de cosas que todavía no se corren, y la
 *      respuesta se lee igual de bien en un párrafo;
 *    · la ciudad la sigue necesitando el agente de Tendencias, y en una
 *      marca de producto además dice a qué mercado le vende;
 *    · lo que más le preguntan sus clientes es la mina de oro del
 *      contenido, y en producto son preguntas concretísimas —de qué está
 *      hecho, cuánto rinde, si sirve para piel grasa— que son una pieza
 *      cada una;
 *    · el Instagram vale más que los tres juntos: con verlo se saca su
 *      paleta, qué fotos ya tiene y qué tan mal está su contenido actual.
 *
 *  Todos opcionales, y va aparte del paso 1 a propósito: un formulario de
 *  ocho campos espanta prospectos, y perder el prospecto es peor que tener
 *  poca información. */
export const contextoSchema = z.object({
  leadId: z.string().uuid(),
  vende: z.string().trim().max(300).optional(),
  ciudad: z.string().trim().max(80).optional(),
  preguntan: z.string().trim().max(300).optional(),
  instagram: z.string().trim().max(120).optional(),
});

export type ContextoInput = z.infer<typeof contextoSchema>;
