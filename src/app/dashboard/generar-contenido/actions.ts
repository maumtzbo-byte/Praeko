"use server";

import { createClient } from "@/lib/supabase/server";
import { generateMonthlyStrategy } from "@/lib/agents/strategy-script-agent";
import { PLAN_LIMITS, type PlanKey } from "@/lib/plans/limits";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

// Hard ceiling on paid Claude calls per business per day — protects against
// runaway spend from repeated clicks or a bug, independent of any plan.
const MAX_GENERATION_RUNS_PER_DAY = 5;

/** Generates the next `days` of content for a business and saves them to content_calendar. */
export async function generateContentPlan(
  businessId: string,
  days = 7,
): Promise<ActionResult<{ created: number; runsRemainingToday: number }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado." };

    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const { count: runsToday } = await supabase
      .from("content_generation_runs")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .gte("created_at", startOfToday.toISOString());

    if ((runsToday ?? 0) >= MAX_GENERATION_RUNS_PER_DAY) {
      return {
        success: false,
        error: `Ya generaste el máximo de planes de contenido por hoy (${MAX_GENERATION_RUNS_PER_DAY}). Intenta de nuevo mañana.`,
      };
    }

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
      console.error("generateMonthlyStrategy failed", err);
      const message = err instanceof Error ? err.message : "No se pudo generar el plan.";
      return { success: false, error: message };
    }

    // Record the run right after the paid Claude call succeeds — the money
    // is spent at this point regardless of whether the upsert below fails.
    const { error: runLogError } = await supabase
      .from("content_generation_runs")
      .insert({ business_id: businessId, days_requested: days });
    if (runLogError) {
      // Don't fail the request over this — the content was already generated
      // and paid for — but log it: a silent failure here breaks the daily
      // rate limit's count.
      console.error("Failed to log content_generation_runs", runLogError);
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

    const runsRemainingToday = Math.max(0, MAX_GENERATION_RUNS_PER_DAY - ((runsToday ?? 0) + 1));
    return { success: true, data: { created: inserted?.length ?? 0, runsRemainingToday } };
  } catch (err) {
    console.error("generateContentPlan failed", err);
    return { success: false, error: "No se pudo generar el plan. Intenta de nuevo." };
  }
}
