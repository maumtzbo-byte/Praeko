import { Check, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// There's no self-serve checkout yet (Stripe isn't wired up) — instead of a
// dead "Próximamente" button that promises a purchase flow that doesn't
// exist, this sends a real, prefilled request to a human who can activate
// the plan manually. Honest about the current state, but still a concrete
// action a visitor can take right now.
function requestPlanEmailHref(businessName: string, planDisplayName: string, priceUsd: number) {
  const subject = `Quiero activar el plan ${planDisplayName}`;
  const body = `Hola,\n\nQuiero activar el plan ${planDisplayName} ($${priceUsd} USD/mes) para mi negocio "${businessName}".\n\nGracias.`;
  return `mailto:soporte@praeko.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export default async function PlanPage() {
  const { business } = await getCurrentBusiness();
  const supabase = await createClient();

  const [{ data: plans }, { data: subscription }] = await Promise.all([
    supabase.from("plans").select("*").order("price_usd_cents"),
    supabase.from("subscriptions").select("*").eq("business_id", business.id).maybeSingle(),
  ]);

  return (
    <div>
      <PageHeader
        title="Mi plan"
        description={
          subscription
            ? `Tu plan actual es ${subscription.plan_key} (${subscription.status}).`
            : "Todavía no tienes una suscripción activa — elige un plan para empezar a generar contenido."
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
                isFeatured && "border-transparent bg-zinc-950 text-white dark:bg-white dark:text-zinc-950",
                isCurrent && "border-accent",
              )}
            >
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                  <h3 className={cn("text-lg font-semibold", isFeatured ? "text-white dark:text-zinc-950" : "text-zinc-900 dark:text-zinc-100")}>
                    {plan.display_name}
                  </h3>
                  {isCurrent && <Badge variant="success">Plan actual</Badge>}
                  {isFeatured && (
                    <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-white">
                      MÁS POPULAR
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight">${priceUsd.toFixed(0)}</span>
                  <span className={cn("text-sm", isFeatured ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-500 dark:text-zinc-400")}>USD/mes</span>
                </div>
                <ul className={cn("flex flex-col gap-2 text-sm", isFeatured ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-600 dark:text-zinc-400")}>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-accent" /> {plan.videos_per_month} videos/mes
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-accent" /> {plan.images_per_month} imágenes/mes
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 shrink-0 text-accent" /> {plan.social_network_limit} redes sociales
                  </li>
                </ul>
                {isCurrent ? (
                  <Button variant="secondary" disabled>
                    Plan activo
                  </Button>
                ) : (
                  <a href={requestPlanEmailHref(business.name, plan.display_name, priceUsd)}>
                    <Button
                      variant={isFeatured ? undefined : "secondary"}
                      className={isFeatured ? "w-full bg-accent text-white hover:bg-accent-strong" : "w-full"}
                    >
                      <Mail className="h-4 w-4" />
                      Solicitar este plan
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Aún no hay pago en línea — al solicitar un plan te contactamos por correo para activarlo a la brevedad.
      </p>
    </div>
  );
}
