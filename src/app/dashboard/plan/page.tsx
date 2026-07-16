import { Check } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
            : "Todavía no tienes una suscripción activa."
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {(plans ?? []).map((plan) => {
          const isCurrent = subscription?.plan_key === plan.key;
          return (
            <Card key={plan.key} className={isCurrent ? "border-zinc-950" : undefined}>
              <CardContent className="flex flex-col gap-4 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-zinc-900">{plan.display_name}</h3>
                  {isCurrent && <Badge variant="success">Plan actual</Badge>}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight">
                    ${(plan.price_usd_cents / 100).toFixed(0)}
                  </span>
                  <span className="text-sm text-zinc-500">USD/mes</span>
                </div>
                <ul className="flex flex-col gap-2 text-sm text-zinc-600">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-zinc-400" /> {plan.videos_per_month} videos/mes
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-zinc-400" /> {plan.images_per_month} imágenes/mes
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-zinc-400" /> {plan.social_network_limit} redes sociales
                  </li>
                </ul>
                <Button variant={isCurrent ? "secondary" : "primary"} disabled={isCurrent}>
                  {isCurrent ? "Plan activo" : "Próximamente"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
