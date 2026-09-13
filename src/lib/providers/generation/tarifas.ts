/**
 * Lo que cobra fal.ai, en dólares.
 *
 * Vive aparte de `fal-provider.ts` por una razón concreta: ese archivo lee
 * la llave de API y no debe importarse desde ningún lado que acabe en el
 * navegador. Las tarifas sí se necesitan en otros lugares —calcular el
 * margen de un paquete, estimar lo que va a costar una muestra— y no son
 * secretas. Separarlas deja que las use quien sea sin arrastrar la llave.
 *
 * Tarifas verificadas el 2026-09-11 contra las páginas de cada modelo en
 * fal.ai. Si fal.ai las mueve, esto queda viejo en silencio; por eso están
 * juntas y fechadas.
 *
 * Kling v3 Pro cobra $0.112/s sin audio y $0.168/s con audio. Va la de
 * audio porque los paquetes prometen video con audio.
 *
 * Seedance 2.0 a 720p con audio cuesta $0.3034/s: casi el doble que Kling,
 * y a MENOR resolución.
 */

export const TARIFA_VIDEO_POR_SEGUNDO: Record<string, number> = {
  "fal-ai/kling-video/v3/pro/text-to-video": 0.168,
  // Image-to-video cuesta MENOS que text-to-video en Kling: $0.14 contra
  // $0.168. Las dos estaban en 0.168 y eso inflaba el costo estimado 20%,
  // porque el camino que de verdad se usa es siempre este — hay fotos del
  // producto como referencia en toda pieza de cliente.
  "fal-ai/kling-video/v3/pro/image-to-video": 0.14,
  "bytedance/seedance-2.0/text-to-video": 0.3034,
  "bytedance/seedance-2.0/image-to-video": 0.3034,
};

/**
 * Lo máximo que cada proveedor puede generar de un jalón, en segundos.
 *
 * Kling v3 Pro acepta de 3 a 15 segundos. Pedirle 20 no da un video de 20
 * segundos: da un error de fal.ai después de haber reservado el cupo del
 * plan. Los presets de fábrica no caen ahí —el único que pide 20 segundos
 * es Max, y ese usa Seedance— pero un plan ajustado a mano sí puede
 * (`custom_video_max_seconds`), y el síntoma sería "la generación falla y
 * no se sabe por qué".
 */
export const MAX_SEGUNDOS_POR_PROVEEDOR: Record<string, number> = {
  "kling-3.0-pro": 15,
  "seedance-2.0-standard-720p": 30,
};

/** Acota los segundos a lo que el proveedor puede producir. Sin tope
 *  conocido, se respeta lo pedido: es mejor intentarlo que recortar un
 *  video por una tabla incompleta. */
export function segundosQueAcepta(proveedor: string, segundos: number): number {
  const tope = MAX_SEGUNDOS_POR_PROVEEDOR[proveedor];
  return tope === undefined ? segundos : Math.min(segundos, tope);
}

/** Flux dev cobra $0.025 por megapixel, redondeando hacia arriba. No le
 *  mandamos `image_size`, así que sale el tamaño por defecto del endpoint,
 *  que queda por debajo de un megapixel y se cobra como uno. */
export const TARIFA_IMAGEN = 0.025;

/** Lo que cuesta un segundo de video con cada proveedor de la tabla de
 *  planes (ver PlanLimits.videoProvider). Es la misma tarifa de arriba,
 *  indexada por el nombre que usan los planes en vez de por el slug del
 *  modelo. */
//
//  Se usa la tarifa de IMAGE-to-video y no la de texto: toda pieza de
//  cliente lleva fotos del producto como referencia, así que ese es el
//  camino real (ver `submitVideo` en fal-provider.ts).
export const TARIFA_POR_PROVEEDOR: Record<string, number> = {
  "kling-3.0-pro": 0.14,
  "seedance-2.0-standard-720p": 0.3034,
};

/**
 * Pesos por dólar.
 *
 * Está escrito y fechado a propósito en vez de consultarse: un margen que
 * cambia solo cada vez que se mueve el tipo de cambio es imposible de
 * comparar contra el del mes pasado. Se actualiza a mano cuando se quiera
 * recalcular, y la fecha dice qué tan viejo está el número.
 */
export const PESOS_POR_DOLAR = Number(process.env.NEXT_PUBLIC_TIPO_DE_CAMBIO ?? 18.5);
export const TIPO_DE_CAMBIO_AL = "septiembre de 2026";
