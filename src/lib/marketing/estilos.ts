import { CATEGORIAS_PRODUCTO } from "@/lib/validation/lead";

/**
 * Los estilos visuales que el prospecto puede elegir, con referencias de
 * su propia categoría.
 *
 * Existe porque "¿qué tono quieres para tu marca?" es una pregunta
 * imposible para alguien que no es diseñador, y la respuesta que da —
 * "profesional pero cercano"— no le sirve de nada a quien va a producir.
 * Señalar una marca que le gusta, en cambio, lo hace cualquiera en dos
 * segundos, y de ahí sale una instrucción concreta.
 *
 * Las referencias van en TEXTO y nunca como logo. Nombrar una marca para
 * describir un estilo es uso normal; poner su logo dentro de tu
 * formulario sugiere una relación que no existe, y el costo real de eso
 * no es un abogado: es que Meta rechace los anuncios por usar marcas de
 * terceros, justo en el canal del que dependen los prospectos.
 *
 * Y la referencia de texto hace mejor el trabajo de todos modos. El logo
 * de Starbucks es una sirena verde: no dice nada de cómo fotografían. Lo
 * que comunica el estilo es la imagen de ejemplo, que va al lado.
 */

export type Estilo = {
  id: string;
  nombre: string;
  /** La referencia, en texto. Opcional: hay categorías donde no hay una
   *  marca lo bastante conocida como para que sirva de atajo, y ahí el
   *  nombre del estilo tiene que sostenerse solo. */
  referencia?: string;
  /** Lo que se le pasa al generador. Es la razón de ser de todo esto: la
   *  elección del cliente tiene que convertirse en una instrucción, no en
   *  una etiqueta que alguien interprete después. */
  instruccion: string;
};

/** Los cinco que sirven para cualquier producto empacado. Cambian las
 *  referencias, no las direcciones. */
const BASE: Estilo[] = [
  {
    id: "limpio",
    nombre: "Limpio y clínico",
    instruccion:
      "fondo liso y claro, luz pareja y sin drama, composición centrada, mucho aire alrededor del producto, paleta fría y neutra",
  },
  {
    id: "calido",
    nombre: "Cálido y natural",
    instruccion:
      "superficies de madera, lino o piedra, luz lateral de mañana, sombras suaves y largas, paleta de tierra y ámbar, algo de vegetación seca",
  },
  {
    id: "editorial",
    nombre: "Editorial",
    instruccion:
      "mármol o cemento pulido, sombras duras y recortadas, encuadre de revista, un solo elemento acompañando, contraste alto",
  },
  {
    id: "oscuro",
    nombre: "Oscuro y premium",
    instruccion:
      "fondo negro o muy oscuro, luz de borde que recorta la silueta, reflejos metálicos o dorados, humo o vapor tenue, aire de lujo",
  },
  {
    id: "juguetón",
    nombre: "Fresco y juguetón",
    instruccion:
      "colores saturados y planos, pasteles, props geométricos, luz frontal alegre, composición asimétrica y desenfadada",
  },
];

/** Las referencias por categoría. Solo se nombran marcas cuyo estilo es
 *  reconocible de verdad; inventar una referencia floja es peor que no
 *  poner ninguna, porque manda al prospecto a imaginar otra cosa. */
const REFERENCIAS: Partial<Record<(typeof CATEGORIAS_PRODUCTO)[number], Record<string, string>>> = {
  "Skincare y cosmética": {
    limpio: "tipo The Ordinary",
    calido: "tipo Aesop",
    juguetón: "tipo Glossier",
  },
  "Café de especialidad": {
    limpio: "tipo Blue Bottle",
    calido: "tipo tostador de barrio",
    oscuro: "tipo Starbucks Reserve",
  },
  "Cuidado del cabello": {
    limpio: "tipo The Ordinary",
    calido: "tipo Aesop",
  },
  Perfumes: {
    oscuro: "tipo Tom Ford",
    editorial: "tipo Le Labo",
  },
  "Velas y aromas para el hogar": {
    calido: "tipo Diptyque",
    editorial: "tipo Le Labo",
  },
};

/** Los estilos que le tocan a una categoría, con su referencia puesta. */
export function estilosPara(categoria: string): Estilo[] {
  const refs = REFERENCIAS[categoria as (typeof CATEGORIAS_PRODUCTO)[number]] ?? {};
  return BASE.map((estilo) => ({ ...estilo, referencia: refs[estilo.id] }));
}

/** Traduce lo que eligió el cliente a la instrucción que recibe el
 *  generador. Elegir dos o tres es normal y deseable: una marca casi nunca
 *  cabe en una sola dirección. */
export function instruccionDeEstilos(ids: string[]): string {
  const elegidos = BASE.filter((e) => ids.includes(e.id));
  if (elegidos.length === 0) return "";
  return elegidos.map((e) => e.instruccion).join("; ");
}

export const IDS_DE_ESTILO = BASE.map((e) => e.id);
