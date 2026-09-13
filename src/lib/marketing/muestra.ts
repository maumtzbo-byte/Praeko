import { instruccionDeEstilos } from "./estilos";

/**
 * La instrucción con la que se produce una pieza de muestra.
 *
 * Es distinta de la de un cliente y a propósito. Para un cliente, el agente
 * de estrategia decide QUÉ decir a partir de su marca, su tono y el
 * calendario. Para un prospecto no hay nada de eso: hay una categoría, unas
 * fotos que se bajaron de su Instagram y, con suerte, el estilo que eligió.
 *
 * Y la muestra tiene un trabajo más angosto que una pieza de cliente: no
 * tiene que vender el producto, tiene que demostrar que sabemos
 * fotografiarlo. Por eso no lleva texto, ni promoción, ni llamada a la
 * acción — nada que se pueda equivocar sobre un negocio que no conocemos.
 * Una toma limpia del producto, bien iluminada, que se vea cara.
 */

/** Lo que se le pide al generador cuando el prospecto no eligió estilo.
 *
 *  Es deliberadamente el más seguro de los cinco: fondo liso, luz pareja,
 *  producto centrado. Un estilo con carácter puede fallar más feo, y la
 *  primera pieza que alguien ve de nosotros no es el lugar para arriesgar. */
const ESTILO_POR_OMISION =
  "fondo liso y claro, luz pareja y sin drama, composición centrada, mucho aire alrededor del producto, paleta fría y neutra, cero adornos";

export type ContextoDeMuestra = {
  negocio: string;
  giro: string;
  /** Los ids de estilo que eligió el prospecto, si llegó a elegir. */
  estilos: string[];
  /** Qué producto dijo que quiere promocionar, en sus palabras. */
  vende: string | null;
};

export function promptDeMuestra(contexto: ContextoDeMuestra): string {
  const estilo = instruccionDeEstilos(contexto.estilos) || ESTILO_POR_OMISION;

  return [
    `Toma publicitaria del producto de ${contexto.negocio}, una marca mexicana de ${contexto.giro.toLowerCase()}.`,
    contexto.vende ? `El producto es: ${contexto.vende}.` : null,
    `Dirección visual: ${estilo}.`,
    // Estas tres reglas son las que separan una muestra que se puede
    // mandar de una que hay que tirar. El texto generado es el defecto más
    // delator de todos —letras que parecen letras y no dicen nada— y aquí
    // no aporta nada, así que se prohíbe de entrada.
    "El producto debe verse EXACTAMENTE igual al de la foto de referencia: misma forma, misma tapa, misma etiqueta, mismos colores.",
    "Sin texto de ningún tipo en la imagen. Sin logos inventados. Sin manos ni personas.",
    "Calidad de fotografía comercial de producto: enfoque nítido, sombras suaves y coherentes, sin ruido.",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Cuánto se puede gastar en muestras al mes, en dólares.
 *
 * Existe porque una muestra no consume el cupo de ningún plan —no es
 * entrega, es gasto de venta— y sin un tope explícito no hay nada que
 * detenga una tarde de clics distraídos. A 30 prospectos por ronda y ~$2
 * por muestra, veinte dólares cubren una campaña completa de prospección.
 */
export const TOPE_MENSUAL_MUESTRAS_USD = Number(process.env.TOPE_MUESTRAS_USD ?? 20);

/** El proveedor con el que se producen las muestras.
 *
 *  Kling y no Seedance: cuesta menos de la mitad por segundo y entrega
 *  1080p contra 720p (ver src/lib/providers/generation/tarifas.ts). Para
 *  algo que se manda por mensaje y se ve en un celular, esa es toda la
 *  decisión. */
export const PROVEEDOR_DE_MUESTRA = "kling-3.0-pro" as const;

/** Segundos de la muestra. Cinco alcanzan para que se vea el producto con
 *  movimiento, y es el escalón más barato que produce algo que parezca un
 *  reel y no un GIF. */
export const SEGUNDOS_DE_MUESTRA = 5;
