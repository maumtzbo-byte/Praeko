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
 *  referencias, no las direcciones.
 *
 *  Los nombres son cosas que se ven —lino, mármol, dorado— y no pares de
 *  adjetivos. "Cálido y natural" y "Oscuro y premium" describían un humor,
 *  no una imagen: dos personas leen eso y se imaginan cosas distintas, y
 *  además es el mismo relleno que hace que un texto suene a máquina.
 *  "Lino y madera" nombra dos materiales que cualquiera ve en su cabeza
 *  antes de acabar de leer. */
const BASE: Estilo[] = [
  {
    id: "limpio",
    nombre: "De laboratorio",
    instruccion:
      "fondo liso y claro, luz pareja y sin drama, composición centrada, mucho aire alrededor del producto, paleta fría y neutra, cero adornos",
  },
  {
    id: "calido",
    nombre: "Lino y madera",
    instruccion:
      "superficies de madera, lino o barro, luz lateral de mañana, sombras suaves y largas, paleta de tierra y ámbar, ramas secas o piedra acompañando",
  },
  {
    id: "editorial",
    nombre: "Mármol y sombra dura",
    instruccion:
      "mármol o cemento pulido, sombras duras y recortadas por sol directo, simetría arquitectónica, encuadre de revista, un solo elemento acompañando, contraste alto",
  },
  {
    id: "oscuro",
    nombre: "Negro y dorado",
    instruccion:
      "fondo negro o muy oscuro, luz de borde que recorta la silueta, reflejos metálicos y dorados, humo o vapor tenue, aire de lujo y misterio",
  },
  {
    id: "jugueton",
    nombre: "Fondos de color",
    instruccion:
      "fondo de un solo color saturado o pastel que contrasta con el envase, luz frontal suave, composición asimétrica, sin texturas ni props que distraigan",
  },
];

/** Las referencias por categoría.
 *
 *  Solo se nombra una marca cuando su estilo visual está documentado y es
 *  reconocible de verdad, no cuando la marca es famosa. Una referencia
 *  floja es peor que ninguna: manda al prospecto a imaginarse otra cosa y
 *  después reclama que la muestra no se parece.
 *
 *  Por eso hay categorías sin referencia —tés, salsas, suplementos,
 *  joyería—: no encontré una marca cuyo estilo fotográfico fuera lo
 *  bastante distintivo y conocido como para servir de atajo, y prefiero
 *  dejarlo vacío que inventarlo. Ahí el nombre del estilo se sostiene
 *  solo, que para eso se renombraron.
 *
 *  Perfiles confirmados: The Ordinary es clínico y centrado en el
 *  ingrediente; Aesop es minimalismo brutalista, simetría arquitectónica y
 *  tonos apagados; Glossier son bloques de color contrastantes con luz
 *  suave; Le Labo es blanco y negro con tipografía de máquina de escribir;
 *  Blue Bottle es minimalismo limpio en azul claro; Stumptown es papel
 *  kraft, textura sucia y blanco y negro; Onyx Coffee Lab es oscuro con
 *  acentos dorados; Boy Smells es rosa y descarado. */
const REFERENCIAS: Partial<Record<(typeof CATEGORIAS_PRODUCTO)[number], Record<string, string>>> = {
  "Skincare y cosmética": {
    limpio: "tipo The Ordinary",
    calido: "tipo Aesop",
    jugueton: "tipo Glossier",
    editorial: "tipo Le Labo",
  },
  "Cuidado del cabello": {
    limpio: "tipo The Ordinary",
    calido: "tipo Aesop",
    jugueton: "tipo Glossier",
  },
  "Café de especialidad": {
    limpio: "tipo Blue Bottle",
    calido: "tipo Stumptown",
    oscuro: "tipo Onyx Coffee Lab",
  },
  Perfumes: {
    editorial: "tipo Le Labo",
    calido: "tipo Aesop",
    oscuro: "tipo Tom Ford",
  },
  "Velas y aromas para el hogar": {
    editorial: "tipo Le Labo",
    calido: "tipo Diptyque",
    jugueton: "tipo Boy Smells",
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
