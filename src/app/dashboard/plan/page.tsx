import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RequestPlanButton from "@/components/dashboard/request-plan-button";
import { BetaTrialTicket } from "@/components/dashboard/beta-trial-ticket";
import { PlanConfigurator } from "@/components/dashboard/plan-configurator";
import { resolveEffectiveLimits, formatUsd } from "@/lib/plans/custom-plan";
import { cn } from "@/lib/utils";

const TRIAL_END_FORMATTER = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long" });

const SUBSCRIPTION_STATUS_LABELS: Record<"active" | "past_due" | "canceled" | "incomplete", string> = {
  active: "activo",
  past_due: "con pago pendiente",
  canceled: "cancelado",
  incomplete: "incompleto",
};

export default async function PlanPage() {
  const { business } = await getCurrentBusiness();
  const supabase = await createClient();

  const [{ data: plans }, { data: subscription }] = await Promise.all([
    supabase.from("plans").select("*").order("price_usd_cents"),
    supabase.from("subscriptions").select("*").eq("business_id", business.id).maybeSingle(),
  ]);

  const trialEndLabel =
    subscription?.is_beta_trial && subscription.current_period_end
      ? TRIAL_END_FORMATTER.format(new Date(subscription.current_period_end))
      : null;
  const trialPlan = trialEndLabel ? (plans ?? []).find((p) => p.key === subscription!.plan_key) : null;
  const currentPlan = subscription ? (plans ?? []).find((p) => p.key === subscription.plan_key) : null;
  const limits = resolveEffectiveLimits(subscription);

  return (
    <div>
      <PageHeader
        title="Mi plan"
        description={
          trialEndLabel
            ? "Cuando quieras más que el plan Básico, solicita Pro o Max abajo."
            : subscription
              ? `Tu plan actual es ${currentPlan?.display_name ?? subscription.plan_key} (${SUBSCRIPTION_STATUS_LABELS[subscription.status]}).`
              : "Todavía no tienes una suscripción activa — elige un plan para empezar a generar contenido."
        }
      />

      {trialEndLabel && trialPlan && (
        <BetaTrialTicket
          customerNumber={business.customer_number}
          planDisplayName={trialPlan.display_name}
          trialEndLabel={trialEndLabel}
          priceUsd={trialPlan.price_usd_cents / 100}
        />
      )}

      {/* Un plan ajustado ya no coincide con ninguna de las tarjetas de
          abajo, así que sus cantidades reales tienen que estar visibles en
          algún lado o el dueño no tiene forma de saber qué contrató. */}
      {limits.isCustomized && (
        <Card className="mb-6 border-accent">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-zinc-900">Tu plan a la medida</h3>
                  <Badge variant="success">Activo</Badge>
                </div>
                <p className="mt-0.5 text-sm text-zinc-500">
                  Sobre la base del plan {limits.plan.displayName}.
                </p>
              </div>
              {subscription?.custom_price_usd_cents != null && (
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-semibold tracking-tight text-zinc-900">
                    {formatUsd(subscription.custom_price_usd_cents)}
                  </span>
                  <span className="text-sm text-zinc-500">USD/mes</span>
                </div>
              )}
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-zinc-600 sm:grid-cols-4">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-accent" /> {limits.videosPerMonth} videos
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-accent" /> hasta {limits.videoMaxSeconds}s c/u
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-accent" /> {limits.imagesPerMonth} imágenes
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 shrink-0 text-accent" /> {limits.carouselsPerMonth} carruseles
              </li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Mismo carrusel con snap que la sección de precios del sitio
          público (PricingSection.tsx): en celular se desliza de lado con la
          siguiente tarjeta asomándose, en escritorio vuelve a ser una
          cuadrícula de tres. Apiladas verticalmente, comparar planes obliga
          a recordar lo que ya se pasó de largo. Los márgenes negativos
          cancelan el padding del main para que el carrusel llegue al borde
          de la pantalla. */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0">
        {(plans ?? []).map((plan) => {
          const isCurrent = subscription?.plan_key === plan.key;
          // Same "most popular" anchor as the marketing pricing page — the
          // Pro tier is the one most businesses should land on, so it gets
          // the same visual weight here as it does before signup.
          const isFeatured = plan.key === "pro" && !isCurrent;
          const priceUsd = plan.price_usd_cents / 100;

          return (
            <Card
              key={plan.key}
              className={cn(
                // w-[82%] deja ver el filo de la siguiente tarjeta, que es
                // lo que le avisa a alguien en celular que hay más a la
                // derecha; h-full las empareja de altura en la cuadrícula.
                "w-[82%] shrink-0 snap-center md:w-auto md:shrink",
                isFeatured && "border-transparent bg-zinc-950 text-white ",
                isCurrent && "border-accent",
              )}
            >
              <CardContent className="flex h-full flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                  <h3 className={cn("text-lg font-semibold", isFeatured ? "text-white" : "text-zinc-900")}>
                    {plan.display_name}
                  </h3>
                  {isCurrent && (
                    <Badge variant="success">{subscription?.is_beta_trial ? "Mes gratis de prueba" : "Plan actual"}</Badge>
                  )}
                  {isFeatured && (
                    <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-white">
                      MÁS POPULAR
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight">${priceUsd.toFixed(0)}</span>
                  <span className={cn("text-sm", isFeatured ? "text-zinc-400" : "text-zinc-500")}>USD/mes</span>
                </div>
                {/* Antes solo listaba videos/imágenes/redes, escondiendo la
                    mitad de lo que realmente separa un plan de otro (duración
                    de video, subtítulos, analíticas) — datos que ya estaban en
                    la tabla sin mostrarse. flex-1 empuja el botón al fondo para
                    que las tres tarjetas alineen su llamada a la acción aunque
                    tengan distinto número de líneas. */}
                <ul className={cn("flex flex-1 flex-col gap-2.5 pt-1 text-sm", isFeatured ? "text-zinc-300" : "text-zinc-600")}>
                  {[
                    `${plan.videos_per_month} videos al mes`,
                    `Videos de hasta ${plan.video_max_seconds} segundos`,
                    `${plan.images_per_month} imágenes al mes`,
                    plan.social_network_limit === 1 ? "1 red social" : `${plan.social_network_limit} redes sociales`,
                    plan.burns_subtitles ? "Subtítulos incluidos" : null,
                    plan.has_optimized_schedule ? "Horarios optimizados" : null,
                    plan.has_analytics_dashboard ? "Analíticas de resultados" : null,
                    plan.has_priority_queue ? "Generación prioritaria" : null,
                    plan.has_watermark_free_downloads ? "Descargas sin marca de agua" : null,
                  ]
                    .filter((feature): feature is string => feature !== null)
                    .map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                        <span>{feature}</span>
                      </li>
                    ))}
                </ul>
                {isCurrent ? (
                  <Button variant="secondary" disabled>
                    Plan activo
                  </Button>
                ) : (
                  <RequestPlanButton
                    businessName={business.name}
                    planDisplayName={plan.display_name}
                    priceUsd={priceUsd}
                    featured={isFeatured}
                  />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col items-center gap-2 text-center">
        <p className="text-sm text-zinc-500">
          ¿Ninguno te queda exacto? <PlanConfigurator businessName={business.name} />
        </p>
        <p className="text-sm text-zinc-500">
          Aún no hay pago en línea — al solicitar un plan te contactamos por correo para activarlo a la brevedad.
        </p>
      </div>
    </div>
  );
}
