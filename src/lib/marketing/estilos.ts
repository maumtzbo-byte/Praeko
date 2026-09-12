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
  /** La marca de referencia, sola y sin formatear.
   *
   *  Guarda "Aesop" y no "Aesop" porque quien pinta decide cómo se
   *  lee: hoy va de título, con el nombre del estilo debajo, porque el
   *  nombre de la marca es el atajo más corto que existe para alguien que
   *  la conoce. Si mañana se quiere al revés, no hay que tocar los datos.
   *
   *  Opcional. Hay categorías sin marca de referencia y ahí el nombre del
   *  estilo pasa a ser el título. */
  marca?: string;
  /** Una línea que dice A QUIÉN le queda, no cómo se ve.
   *
   *  La primera versión describía la imagen —"mármol y sombra de sol
   *  directo"— y en las categorías sin marca quedaba repitiendo el título
   *  casi palabra por palabra. Peor: no ayudaba a decidir.
   *
   *  Lo que sí ayuda es decirle a quién le queda, porque esa ES la
   *  decisión que está tomando. Y sirve igual con marca y sin ella. */
  descripcion: string;
  /** Lo que se le pasa al generador. Es la razón de ser de todo esto: la
   *  elección del cliente tiene que convertirse en una instrucción, no en
   *  una etiqueta que alguien interprete después. */
  instruccion: string;
  /** La muestra visual de respaldo, en CSS.
   *
   *  Una lista de texto se ve plana, y el estilo es justo lo que no se
   *  puede explicar con palabras — de eso se trata preguntarlo señalando.
   *  Estos recuadros son la única parte de la pantalla que enseña de qué
   *  se está hablando.
   *
   *  Es el respaldo, no el destino: en cuanto exista una foto de ejemplo
   *  se usa la foto. Ver `imagenDeEstilo`. */
  muestra: string;
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
    descripcion: "Para producto con ingrediente estrella",
    // Blanco parejo, sin sombra dura: la luz de caja difusora.
    muestra: "radial-gradient(120% 100% at 50% 0%, #ffffff 0%, #f4f6f8 70%, #e8ecf0 100%)",
    instruccion:
      "fondo liso y claro, luz pareja y sin drama, composición centrada, mucho aire alrededor del producto, paleta fría y neutra, cero adornos",
  },
  {
    id: "calido",
    nombre: "Lino y madera",
    descripcion: "Para marca artesanal o botánica",
    // Luz lateral de mañana cayendo sobre tierra y ámbar.
    muestra: "linear-gradient(115deg, #f7ecdd 0%, #e3c9a8 45%, #b98f63 100%)",
    instruccion:
      "superficies de madera, lino o barro, luz lateral de mañana, sombras suaves y largas, paleta de tierra y ámbar, ramas secas o piedra acompañando",
  },
  {
    id: "editorial",
    nombre: "Mármol y sombra dura",
    descripcion: "Para marca que quiere verse cara",
    // El corte recto es la sombra de sol directo, que es todo el estilo.
    muestra:
      "linear-gradient(105deg, #f2f2f0 0%, #f2f2f0 46%, #9a9a97 46.5%, #7e7e7b 72%, #efefed 72.5%, #efefed 100%)",
    instruccion:
      "mármol o cemento pulido, sombras duras y recortadas por sol directo, simetría arquitectónica, encuadre de revista, un solo elemento acompañando, contraste alto",
  },
  {
    id: "oscuro",
    nombre: "Negro y dorado",
    descripcion: "Para producto de regalo o de lujo",
    // Negro con la luz de borde dorada recortando por un lado.
    muestra:
      "linear-gradient(100deg, #0c0c0d 0%, #17171a 55%, #7a5c22 82%, #d9b24c 93%, #1a1a1d 100%)",
    instruccion:
      "fondo negro o muy oscuro, luz de borde que recorta la silueta, reflejos metálicos y dorados, humo o vapor tenue, aire de lujo y misterio",
  },
  {
    id: "jugueton",
    nombre: "Fondos de color",
    descripcion: "Para marca joven que vive en redes",
    // Dos bloques planos que chocan, sin textura. Eso es el estilo.
    muestra: "linear-gradient(135deg, #ffd9e0 0%, #ffd9e0 50%, #b9e3f0 50%, #b9e3f0 100%)",
    instruccion:
      "fondo de un solo color saturado o pastel que contrasta con el envase, luz frontal suave, composición asimétrica, sin texturas ni props que distraigan",
  },
];

/** Qué estilos se le ofrecen a cada categoría, y con qué marca.
 *
 *  Es un catálogo por categoría y no una tabla de referencias sueltas, y
 *  ese cambio resuelve dos cosas a la vez.
 *
 *  La primera es que no todos los estilos le quedan a todo. "Negro y
 *  dorado" es dirección de perfume y de joyería; en skincare casi no
 *  existe. Ofrecerlo ahí era llenar una lista, no dar opciones.
 *
 *  La segunda es de forma: con los cinco fijos, skincare mostraba cuatro
 *  "Tipo X" y una suelta, y esa se veía a medio hacer. Buscando la marca
 *  que faltaba —negro y dorado en skincare— no encontré ninguna que
 *  defendiera: Chanel Sublimage resultó ser blanco y dorado, no negro.
 *  Inventar una referencia floja es peor que no ponerla, porque manda al
 *  prospecto a imaginarse otra cosa y después reclama que la muestra no
 *  se parece. Se quita la opción y ya.
 *
 *  Las categorías que no aparecen aquí reciben los cinco estilos sin
 *  marca. No es un hueco: es que todavía no encuentro referencias
 *  reconocibles para tés, salsas, suplementos ni joyería, y el nombre del
 *  estilo se sostiene solo — para eso se renombraron con cosas que se ven.
 *
 *  Perfiles confirmados: The Ordinary es clínico y centrado en el
 *  ingrediente; Aesop es minimalismo brutalista, simetría arquitectónica y
 *  tonos apagados; Glossier son bloques de color contrastantes con luz
 *  suave; Le Labo es blanco y negro con tipografía de máquina de escribir;
 *  Blue Bottle es minimalismo limpio en azul claro; Stumptown es papel
 *  kraft y textura sucia; Onyx Coffee Lab es oscuro con acentos dorados;
 *  Boy Smells es rosa y descarado. */
const CATALOGO: Partial<Record<(typeof CATEGORIAS_PRODUCTO)[number], { id: string; marca: string }[]>> =
  {
    "Skincare y cosmética": [
      { id: "limpio", marca: "The Ordinary" },
      { id: "calido", marca: "Aesop" },
      { id: "editorial", marca: "Le Labo" },
      { id: "jugueton", marca: "Glossier" },
    ],
    "Cuidado del cabello": [
      { id: "limpio", marca: "The Ordinary" },
      { id: "calido", marca: "Aesop" },
      { id: "editorial", marca: "Le Labo" },
      { id: "jugueton", marca: "Glossier" },
    ],
    "Café de especialidad": [
      { id: "limpio", marca: "Blue Bottle" },
      { id: "calido", marca: "Stumptown" },
      { id: "oscuro", marca: "Onyx Coffee Lab" },
    ],
    Perfumes: [
      { id: "editorial", marca: "Le Labo" },
      { id: "calido", marca: "Aesop" },
      { id: "oscuro", marca: "Tom Ford" },
    ],
    "Velas y aromas para el hogar": [
      { id: "editorial", marca: "Le Labo" },
      { id: "calido", marca: "Diptyque" },
      { id: "jugueton", marca: "Boy Smells" },
    ],
  };

/** Los estilos que le tocan a una categoría.
 *
 *  Con catálogo, se respeta su orden y su marca. Sin catálogo, van los
 *  cinco de base sin marca. */
export function estilosPara(categoria: string): Estilo[] {
  const catalogo = CATALOGO[categoria as (typeof CATEGORIAS_PRODUCTO)[number]];
  if (!catalogo) return BASE.map((estilo) => ({ ...estilo }));

  return catalogo.flatMap(({ id, marca }) => {
    const base = BASE.find((e) => e.id === id);
    return base ? [{ ...base, marca }] : [];
  });
}

/** La foto de ejemplo de un estilo, si ya existe.
 *
 *  Se resuelve por convención de nombre y no por una lista que haya que
 *  mantener: el archivo va en `public/estilos/{id}.webp` y con soltarlo
 *  ahí la interfaz lo usa. Nadie tiene que tocar código para estrenar una
 *  imagen, que es justo lo que hace que las imágenes nunca se estrenen.
 *
 *  `ESTILOS_CON_FOTO` es la única lista que hay que tocar, y tiene una
 *  razón de ser: sin ella el navegador pediría cinco archivos que no
 *  existen y pintaría cinco recuadros rotos. Cuando generes las fotos,
 *  agregas el id aquí y listo.
 *
 *  Las fotos son TUYAS, generadas con tu producto. No pueden ser las de
 *  las marcas de referencia: el nombre de una marca es marca registrada y
 *  nombrarlo para describir un estilo es uso referencial permitido, pero
 *  su fotografía es derecho de autor y para eso no hay doctrina que
 *  salve. Copiarla sería infracción directa, y es lo que las marcas sí
 *  tumban con un aviso al hosting.
 *
 *  El prompt de cada una ya está escrito: es el campo `instruccion` de
 *  este mismo archivo. */
const ESTILOS_CON_FOTO: string[] = [];

export function imagenDeEstilo(estilo: Estilo): string | null {
  return ESTILOS_CON_FOTO.includes(estilo.id) ? `/estilos/${estilo.id}.webp` : null;
}

/** El título de una opción: la marca si la hay, y si no el nombre del
 *  estilo. "Aesop" le dice más en un segundo a quien vende skincare que
 *  cualquier descripción; a quien vende salsas no le dice nada, y ahí
 *  "Lino y madera" sigue funcionando. */
export function tituloDeEstilo(estilo: Estilo): string {
  return estilo.marca ? `Tipo ${estilo.marca}` : estilo.nombre;
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
