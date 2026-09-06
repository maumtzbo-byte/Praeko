import { PLAN_LIMITS, type PlanKey, type PlanLimits } from "./limits";

/**
 * Planes ajustables: un negocio parte de un preset (Básico/Pro/Max) y puede
 * mover las cantidades. Este módulo es el único lugar donde vive la
 * aritmética — cuánto cuesta producir cada cosa, cuánto se cobra por ella, y
 * qué límites terminan aplicando cuando una suscripción trae ajustes.
 *
 * Las tarifas de abajo salen de los costos reales verificados en la
 * auditoría: fal.ai cobra Kling por segundo de video generado (~$0.07–0.112
 * USD/s según la fuente; aquí se usa el extremo caro para no quedarse
 * corto), y las imágenes cuestan centavos. El resto —Claude para el guion,
 * el revisor de marca, storage— es chico frente al video, pero existe por
 * cuenta aunque el negocio no genere nada, y por eso hay una base fija.
 */

/** Costo aproximado de producción, en centavos de USD. Sirve para calcular
 * margen y para que nadie configure un plan que se venda por debajo del
 * costo — no se le muestra al cliente. */
export const UNIT_COST_CENTS = {
  videoSecond: 12,
  image: 6,
  carouselImage: 6,
} as const;

/** Cuántas imágenes produce un carrusel. Determina tanto su costo como su
 * precio de venta. */
export const CAROUSEL_IMAGE_COUNT = 4;

/** Tarifas de venta, en centavos de USD. Calibradas para que un plan armado
 * con las cantidades del Básico dé aproximadamente su precio actual de $99
 * — así los planes ajustables no rompen la lista de precios existente. */
export const PRICING_CENTS = {
  /** Cargo fijo mensual por cuenta: el agente de estrategia, las
   * analíticas y el storage corren exista o no volumen. Sin esta base,
   * alguien arma "1 video" y la cuenta sale en pérdida. */
  base: 1900,
  /** Por segundo de video contratado (cantidad × duración máxima). */
  videoSecond: 70,
  image: 125,
  carousel: 300,
} as const;

export interface CustomPlanSelection {
  videosPerMonth: number;
  imagesPerMonth: number;
  carouselsPerMonth: number;
  /** Duración máxima por video, en segundos. */
  videoMaxSeconds: number;
}

/** Rangos que acepta el configurador. Topes altos a propósito: existen para
 * frenar un error de dedo o un valor manipulado desde el cliente, no para
 * limitar lo que un negocio grande pueda contratar. */
export const SELECTION_BOUNDS = {
  videosPerMonth: { min: 0, max: 60 },
  imagesPerMonth: { min: 0, max: 120 },
  carouselsPerMonth: { min: 0, max: 60 },
  videoMaxSeconds: { min: 5, max: 30 },
} as const;

export function clampSelection(selection: CustomPlanSelection): CustomPlanSelection {
  const clamp = (value: number, { min, max }: { min: number; max: number }) =>
    Math.min(max, Math.max(min, Math.round(Number.isFinite(value) ? value : min)));

  return {
    videosPerMonth: clamp(selection.videosPerMonth, SELECTION_BOUNDS.videosPerMonth),
    imagesPerMonth: clamp(selection.imagesPerMonth, SELECTION_BOUNDS.imagesPerMonth),
    carouselsPerMonth: clamp(selection.carouselsPerMonth, SELECTION_BOUNDS.carouselsPerMonth),
    videoMaxSeconds: clamp(selection.videoMaxSeconds, SELECTION_BOUNDS.videoMaxSeconds),
  };
}

/** El presupuesto mensual de segundos que implica una selección. Es lo que
 * recibe el guard atómico como p_max_seconds. */
export function selectionSecondsBudget(selection: CustomPlanSelection): number {
  return selection.videosPerMonth * selection.videoMaxSeconds;
}

export function selectionCostCents(selection: CustomPlanSelection): number {
  return (
    selectionSecondsBudget(selection) * UNIT_COST_CENTS.videoSecond +
    selection.imagesPerMonth * UNIT_COST_CENTS.image +
    selection.carouselsPerMonth * CAROUSEL_IMAGE_COUNT * UNIT_COST_CENTS.carouselImage
  );
}

export function selectionPriceCents(selection: CustomPlanSelection): number {
  return (
    PRICING_CENTS.base +
    selectionSecondsBudget(selection) * PRICING_CENTS.videoSecond +
    selection.imagesPerMonth * PRICING_CENTS.image +
    selection.carouselsPerMonth * PRICING_CENTS.carousel
  );
}

/** Margen bruto de una selección, 0–1. Se usa para no dejar guardar un plan
 * que se venda por debajo de lo que cuesta producirlo — puede pasar con
 * cantidades extremas de video, donde el costo crece más rápido que la base. */
export function selectionMargin(selection: CustomPlanSelection): number {
  const price = selectionPriceCents(selection);
  if (price <= 0) return 0;
  return (price - selectionCostCents(selection)) / price;
}

/** Piso de margen aceptable. Debajo de esto el configurador rechaza la
 * combinación en vez de venderla. */
export const MIN_ACCEPTABLE_MARGIN = 0.5;

/** La selección que representa un preset tal cual viene de fábrica — el
 * punto de partida del configurador cuando alguien elige "Básico". */
export function selectionFromPlan(plan: PlanLimits): CustomPlanSelection {
  return {
    videosPerMonth: plan.videosPerMonth,
    // Los presets no distinguen carrusel de imagen (todo cae en
    // images_per_month), así que al abrir el configurador el carrusel
    // arranca en cero y el negocio decide si quiere convertir parte de sus
    // imágenes en carruseles.
    imagesPerMonth: plan.imagesPerMonth,
    carouselsPerMonth: 0,
    // videoAvgSeconds, no videoMaxSeconds: un preset presupuesta el mes con
    // la duración promedio (videoMaxSeconds es el techo de una sola pieza,
    // no lo que se contrata × la cantidad). Partir del máximo cotizaría el
    // Pro en ~$300 cuando cuesta $199.
    videoMaxSeconds: plan.videoAvgSeconds,
  };
}

/** Lo que una suscripción trae guardado, tal como está en la tabla. */
export interface SubscriptionOverrides {
  plan_key: PlanKey;
  custom_videos_per_month: number | null;
  custom_images_per_month: number | null;
  custom_carousels_per_month: number | null;
  custom_video_max_seconds: number | null;
}

export interface EffectiveLimits {
  videosPerMonth: number;
  imagesPerMonth: number;
  carouselsPerMonth: number;
  videoMaxSeconds: number;
  secondsBudget: number;
  /** Sigue viniendo del preset: define qué modelo de video se usa y qué
   * funciones (subtítulos, analíticas) están disponibles. Ajustar cantidades
   * no cambia de qué plan eres. */
  plan: PlanLimits;
  isCustomized: boolean;
}

/**
 * Resuelve los límites que realmente aplican: los del preset, con los
 * ajustes de la suscripción encima donde existan. Un NULL en la columna
 * significa "sin ajustar", no "cero" — de ahí el `??` en vez de `||`, que
 * trataría un 0 legítimo como ausencia.
 */
export function resolveEffectiveLimits(subscription: SubscriptionOverrides | null): EffectiveLimits {
  const plan = PLAN_LIMITS[subscription?.plan_key ?? "basico"];

  const videosPerMonth = subscription?.custom_videos_per_month ?? plan.videosPerMonth;
  const imagesPerMonth = subscription?.custom_images_per_month ?? plan.imagesPerMonth;
  const carouselsPerMonth = subscription?.custom_carousels_per_month ?? 0;
  const videoMaxSeconds = subscription?.custom_video_max_seconds ?? plan.videoMaxSeconds;

  const isCustomized =
    subscription != null &&
    (subscription.custom_videos_per_month != null ||
      subscription.custom_images_per_month != null ||
      subscription.custom_carousels_per_month != null ||
      subscription.custom_video_max_seconds != null);

  return {
    videosPerMonth,
    imagesPerMonth,
    carouselsPerMonth,
    videoMaxSeconds,
    // Un plan ajustado presupuesta segundos con su propia duración máxima;
    // uno de fábrica conserva el promedio del preset, que es más chico que
    // el tope y por eso permite mezclar videos largos y cortos.
    secondsBudget: isCustomized ? videosPerMonth * videoMaxSeconds : plan.videosPerMonth * plan.videoAvgSeconds,
    plan,
    isCustomized,
  };
}

/**
 * Contra qué cupo se cobra una pieza. Existe por una razón concreta: una
 * suscripción sin ajustar resuelve carouselsPerMonth en 0, así que tratar
 * el carrusel como línea propia de entrada rechazaría cada carrusel de
 * todos los clientes que ya existen. Mientras el plan no esté ajustado, el
 * carrusel sigue consumiendo un crédito de imagen exactamente como antes;
 * solo se separa cuando el negocio configuró un cupo propio para él.
 */
export function usageKindFor(
  format: string,
  contentKind: "imagen" | "video",
  limits: EffectiveLimits,
): "video" | "imagen" | "carrusel" {
  if (contentKind === "video") return "video";
  if (format === "carrusel" && limits.carouselsPerMonth > 0) return "carrusel";
  return "imagen";
}

export function formatUsd(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}
