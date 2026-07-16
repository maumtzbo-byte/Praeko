"use server";

import { createClient } from "@/lib/supabase/server";
import { generateMonthlyStrategy } from "@/lib/agents/strategy-script-agent";
import { PLAN_LIMITS, type PlanKey } from "@/lib/plans/limits";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Generates the next `days` of content for a business and saves them to content_calendar. */
export async function generateContentPlan(
  businessId: string,
  days = 7,
): Promise<ActionResult<{ created: number }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado." };

    const [{ data: business }, { data: brand }, { data: subscription }] = await Promise.all([
      supabase.from("businesses").select("*").eq("id", businessId).single(),
      supabase.from("brand_profiles").select("*").eq("business_id", businessId).maybeSingle(),
      supabase.from("subscriptions").select("plan_key").eq("business_id", businessId).maybeSingle(),
    ]);

    if (!business) return { success: false, error: "Negocio no encontrado." };

    const planKey = (subscription?.plan_key ?? "basico") as PlanKey;
    const plan = PLAN_LIMITS[planKey];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);

    let strategy;
    try {
      strategy = await generateMonthlyStrategy({
        business: {
          name: business.name,
          industry: business.industry,
          description: business.description,
          country: business.country,
          city: business.city,
        },
        brand: {
          brandTone: brand?.brand_tone ?? null,
          mission: brand?.mission ?? null,
          targetAudience: brand?.target_audience ?? null,
          brandValues: brand?.brand_values ?? [],
          sellsDescription: brand?.sells_description ?? null,
          mainProducts: brand?.main_products ?? [],
          goals: brand?.goals ?? [],
        },
        plan,
        startDate: startDate.toISOString().slice(0, 10),
        days,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo generar el plan.";
      return { success: false, error: message };
    }

    const rows = strategy.days.map((d) => ({
      business_id: businessId,
      scheduled_date: d.date,
      content_kind: d.contentKind,
      format: d.format,
      topic: d.topic,
      script: d.script,
      target_duration_seconds: d.contentKind === "video" ? d.targetDurationSeconds ?? null : null,
      recommended_publish_time: d.recommendedPublishTime,
      status: "pendiente" as const,
    }));

    const { data: inserted, error } = await supabase
      .from("content_calendar")
      .upsert(rows, { onConflict: "business_id,scheduled_date,format" })
      .select("id");

    if (error) return { success: false, error: error.message };

    return { success: true, data: { created: inserted?.length ?? 0 } };
  } catch {
    return { success: false, error: "No se pudo generar el plan. Intenta de nuevo." };
  }
}
