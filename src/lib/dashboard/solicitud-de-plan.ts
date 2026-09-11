// There's no self-serve checkout yet (Stripe isn't wired up) — instead of a
// dead "Próximamente" button that promises a purchase flow that doesn't
// exist, this sends a real, prefilled request to a human who can activate
// the plan manually. Honest about the current state, but still a concrete
// action a visitor can take right now.
export function requestPlanEmailHref(businessName: string, planDisplayName: string, priceUsd: number) {
  const subject = `Quiero activar el plan ${planDisplayName}`;
  const body = `Hola,\n\nQuiero activar el plan ${planDisplayName} ($${priceUsd} USD/mes) para mi negocio "${businessName}".\n\nGracias.`;
  return `mailto:soporte@frames.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * La versión para planes ajustados. Deletrea cada cantidad porque del otro
 * lado alguien tiene que capturarlas a mano en las columnas custom_* de la
 * suscripción — un correo que solo dijera "quiero un plan a la medida"
 * obligaría a una ida y vuelta para averiguar cuál.
 */
export function customPlanEmailHref(
  businessName: string,
  selection: {
    videosPerMonth: number;
    videoMaxSeconds: number;
    imagesPerMonth: number;
    carouselsPerMonth: number;
  },
  priceCents: number,
) {
  const subject = `Quiero un plan a la medida ($${Math.round(priceCents / 100)} USD/mes)`;
  const body = [
    "Hola,",
    "",
    `Quiero activar un plan a la medida para mi negocio "${businessName}":`,
    "",
    `• Videos al mes: ${selection.videosPerMonth}`,
    `• Duración por video: hasta ${selection.videoMaxSeconds} segundos`,
    `• Imágenes al mes: ${selection.imagesPerMonth}`,
    `• Carruseles al mes: ${selection.carouselsPerMonth}`,
    "",
    `Precio calculado: $${Math.round(priceCents / 100)} USD/mes.`,
    "",
    "Gracias.",
  ].join("\n");
  return `mailto:soporte@frames.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
