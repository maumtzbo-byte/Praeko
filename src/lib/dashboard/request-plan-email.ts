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
