import { PLAN_LIMITS, type PlanKey } from "./limits";
import {
  MAX_SEGUNDOS_POR_PROVEEDOR,
  PESOS_POR_DOLAR,
  TARIFA_IMAGEN,
  TARIFA_POR_PROVEEDOR,
} from "@/lib/providers/generation/tarifas";

/**
 * Lo que cuesta producir cada paquete de la agencia.
 *
 * Existe porque hasta ahora los paquetes —Entrada, Crecimiento, Completo—
 * vivían nada más como texto en PricingSection.tsx, y su costo no estaba
 * calculado en ningún lado. El único número que circulaba era "la
 * generación cuesta como el 10% del ingreso", sacado del paquete de en
 * medio y aplicado a los tres. No es cierto para los tres, y el que se
 * sale es justo el más caro.
 *
 * Los paquetes se declaran aquí con lo que la página PROMETE, no con los
 * topes de la tabla `plans`. Los topes están deliberadamente por encima
 * para que quepan las regeneraciones (ver el comentario en
 * PricingSection.tsx); el costo de lo prometido es el piso, y las
 * regeneraciones se suman aparte.
 */

export type Paquete = {
  nombre: string;
  /** Precio mensual en pesos, tal como está en la página. */
  precio: number;
  /** El preset de `plans` con el que se sirve. De ahí salen la duración de
   *  los videos y el proveedor, que son lo que decide el costo. */
  plan: PlanKey;
  videos: number;
  imagenes: number;
};

/** Los tres paquetes, iguales a PricingSection.tsx.
 *
 *  Que estén duplicados aquí no es ideal, pero la alternativa —importar la
 *  lista desde el componente— arrastraría "use client" y framer-motion a
 *  cualquier cálculo de servidor. Si cambias un precio allá, cámbialo aquí:
 *  hay una prueba de consistencia en la pantalla de márgenes que lo grita
 *  si se desincronizan. */
export const PAQUETES: Paquete[] = [
  { nombre: "Entrada", precio: 2490, plan: "basico", videos: 4, imagenes: 10 },
  { nombre: "Crecimiento", precio: 4490, plan: "pro", videos: 8, imagenes: 12 },
  { nombre: "Completo", precio: 7900, plan: "max", videos: 16, imagenes: 20 },
];

/**
 * Cuánto de lo generado se manda a rehacer.
 *
 * No es un adorno del cálculo: una regeneración cuesta exactamente lo
 * mismo que la pieza original, así que es un multiplicador directo sobre
 * el costo. El 30% es una estimación —no hay datos propios todavía porque
 * no se ha producido un solo mes real— y por eso está aquí arriba, con
 * nombre, para cambiarla el día que sí haya números.
 */
export const TASA_DE_REGENERACION = 0.3;

export type Margen = {
  paquete: Paquete;
  /** Costo de generar lo prometido, en pesos, sin regeneraciones. */
  costoBase: number;
  /** Costo con las regeneraciones esperadas encima. */
  costoReal: number;
  /** Qué porcentaje del precio se va en generar. */
  porcentaje: number;
  /** Lo que queda antes de tu tiempo, en pesos. */
  bruto: number;
  /** Segundos de video que incluye el paquete. */
  segundos: number;
  proveedor: string;
};

export function margenDe(paquete: Paquete): Margen {
  const plan = PLAN_LIMITS[paquete.plan];
  const porSegundo = TARIFA_POR_PROVEEDOR[plan.videoProvider] ?? 0;

  const segundos = paquete.videos * plan.videoAvgSeconds;
  const costoUsd = segundos * porSegundo + paquete.imagenes * TARIFA_IMAGEN;

  const costoBase = costoUsd * PESOS_POR_DOLAR;
  const costoReal = costoBase * (1 + TASA_DE_REGENERACION);

  return {
    paquete,
    costoBase,
    costoReal,
    porcentaje: (costoReal / paquete.precio) * 100,
    bruto: paquete.precio - costoReal,
    segundos,
    proveedor: plan.videoProvider,
  };
}

export function margenes(): Margen[] {
  return PAQUETES.map(margenDe);
}

/**
 * La alternativa para Completo, y por qué no es obvia.
 *
 * Completo es el único paquete que usa Seedance, que cuesta 117% más por
 * segundo que Kling Y entrega 720p contra los 1080p de Kling. Parece un
 * error heredado de la tabla de planes, pero no lo es: **Kling no acepta
 * más de 15 segundos**, y lo que Completo promete es "videos de mayor
 * duración" — 20 segundos. El modelo caro es el precio de ese
 * diferenciador.
 *
 * Así que la decisión no es "cambiar de modelo", es qué diferencia a
 * Completo: videos más largos a 720p, o los mismos 16 videos a 1080p. Esta
 * función calcula la segunda opción para que la comparación tenga números
 * en vez de intuición.
 *
 * Devuelve null si el paquete ya usa Kling.
 */
export function siFueraConKling(
  margen: Margen,
): { costoReal: number; ahorro: number; porcentaje: number; segundosPorVideo: number } | null {
  if (margen.proveedor === "kling-3.0-pro") return null;

  const segundosPorVideo = MAX_SEGUNDOS_POR_PROVEEDOR["kling-3.0-pro"]!;
  const segundos = margen.paquete.videos * segundosPorVideo;
  const usd = segundos * TARIFA_POR_PROVEEDOR["kling-3.0-pro"]! + margen.paquete.imagenes * TARIFA_IMAGEN;
  const costoReal = usd * PESOS_POR_DOLAR * (1 + TASA_DE_REGENERACION);

  return {
    costoReal,
    ahorro: margen.costoReal - costoReal,
    porcentaje: (costoReal / margen.paquete.precio) * 100,
    segundosPorVideo,
  };
}
