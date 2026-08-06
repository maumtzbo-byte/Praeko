"use server";

import { createClient } from "@/lib/supabase/server";
import { generateCampaignPlan, type StrategyAgentInput } from "@/lib/agents/strategy-script-agent";
import { reviewContentBatch } from "@/lib/agents/brand-reviewer-agent";
import { PLAN_LIMITS, type PlanKey } from "@/lib/plans/limits";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

// Campaign generation is the same paid Claude call as "Generar contenido"
// (content_generation_runs), so it shares that daily cap rather than
// getting its own separate pool.
const MAX_GENERATION_RUNS_PER_DAY = 5;
const MAX_CAMPAIGN_DAYS = 30;

export interface CreateCampaignInput {
  name: string;
  brief: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

function daysBetweenInclusive(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  return Math.round((end - start) / 86_400_000) + 1;
}

/** Creates a campaign and asks the strategy agent to plan every day of it, saving the result to content_calendar tagged with campaign_id. */
export async function createCampaign(
  businessId: string,
  input: CreateCampaignInput,
): Promise<ActionResult<{ campaignId: string; created: number; runsRemainingToday: number }>> {
  try {
    const name = input.name.trim();
    const brief = input.brief.trim();
    if (!name) return { success: false, error: "Ponle un nombre a la campaña." };
    if (!brief) return { success: false, error: "Describe de qué trata la campaña." };

    const days = daysBetweenInclusive(input.startDate, input.endDate);
    if (days < 1) return { success: false, error: "La fecha de fin debe ser igual o posterior a la de inicio." };
    if (days > MAX_CAMPAIGN_DAYS) {
      return { success: false, error: `Las campañas duran máximo ${MAX_CAMPAIGN_DAYS} días.` };
    }

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

    const businessInput: StrategyAgentInput["business"] = {
      name: business.name,
      industry: business.industry,
      description: business.description,
      country: business.country,
      city: business.city,
    };
    const brandInput: StrategyAgentInput["brand"] = {
      brandTone: brand?.brand_tone ?? null,
      mission: brand?.mission ?? null,
      targetAudience: brand?.target_audience ?? null,
      brandValues: brand?.brand_values ?? [],
      sellsDescription: brand?.sells_description ?? null,
      mainProducts: brand?.main_products ?? [],
      goals: brand?.goals ?? [],
    };

    let strategy;
    try {
      strategy = await generateCampaignPlan({
        business: businessInput,
        brand: brandInput,
        plan,
        campaign: { name, brief, startDate: input.startDate, endDate: input.endDate },
      });
    } catch (err) {
      console.error("generateCampaignPlan failed", err);
      const message = err instanceof Error ? err.message : "No se pudo generar el plan de campaña.";
      return { success: false, error: message };
    }

    // Agente Revisor de Marca — same fail-open QA pass as generar-contenido.
    let reviews: Awaited<ReturnType<typeof reviewContentBatch>> = [];
    try {
      reviews = await reviewContentBatch(strategy.days, businessInput, brandInput);
    } catch (err) {
      console.error("reviewContentBatch failed", err);
    }
    const reviewByIndex = new Map(reviews.map((r) => [r.index, r]));

    // Same overlap risk as generar-contenido/actions.ts: the upsert below
    // is keyed on (business_id, scheduled_date, format), the same key a
    // piece that already has generated media or is already published
    // uses. "Campaign piece should win over generic filler" (the original
    // intent here) only holds while the existing row is still just a
    // draft — it doesn't hold once that filler is already live on
    // Instagram. Never touch rows that already moved past draft.
    const targetDates = strategy.days.map((d) => d.date);
    const { data: protectedRows } = await supabase
      .from("content_calendar")
      .select("scheduled_date, format")
      .eq("business_id", businessId)
      .in("scheduled_date", targetDates)
      .in("status", ["generada", "publicada"]);
    const protectedKeys = new Set((protectedRows ?? []).map((r) => `${r.scheduled_date}|${r.format}`));

    // Same accounting as generar-contenido: the Claude call is already paid
    // for at this point regardless of what happens below.
    const { error: runLogError } = await supabase
      .from("content_generation_runs")
      .insert({ business_id: businessId, days_requested: days });
    if (runLogError) {
      console.error("Failed to log content_generation_runs", runLogError);
    }

    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .insert({ business_id: businessId, name, brief, start_date: input.startDate, end_date: input.endDate })
      .select("id")
      .single();

    if (campaignError || !campaign) {
      return { success: false, error: campaignError?.message ?? "No se pudo crear la campaña." };
    }

    // Upsert on (business_id, scheduled_date, format) deliberately overwrites
    // any generic day-to-day DRAFT content already scheduled on these dates —
    // inside a campaign's own date range, the campaign's themed piece
    // should win over generic filler for that day/format. Rows already past
    // draft (protectedKeys, above) are excluded instead of overwritten.
    const rows = strategy.days
      .map((d, i) => ({ d, i }))
      .filter(({ d }) => !protectedKeys.has(`${d.date}|${d.format}`))
      .map(({ d, i }) => {
        const review = reviewByIndex.get(i);
        return {
          business_id: businessId,
          campaign_id: campaign.id,
          scheduled_date: d.date,
          content_kind: d.contentKind,
          format: d.format,
          topic: d.topic,
          script: d.script,
          target_duration_seconds: d.contentKind === "video" ? (d.targetDurationSeconds ?? null) : null,
          recommended_publish_time: d.recommendedPublishTime,
          // A missing review (reviewContentBatch threw, or the batch response
          // omitted this index) must fail closed, same fix as
          // generar-contenido/actions.ts — !review used to fall through to
          // "pendiente" (cleared to proceed automatically), treating "the
          // safety check never ran" the same as "it passed".
          status: !review || review.result !== "aprobado" ? ("en_revision" as const) : ("pendiente" as const),
          review_result: review?.result ?? null,
          review_feedback: review?.feedback ?? null,
        };
      });

    const { data: inserted, error: insertError } =
      rows.length > 0
        ? await supabase.from("content_calendar").upsert(rows, { onConflict: "business_id,scheduled_date,format" }).select("id")
        : { data: [], error: null };

    if (insertError) return { success: false, error: insertError.message };

    const runsRemainingToday = Math.max(0, MAX_GENERATION_RUNS_PER_DAY - ((runsToday ?? 0) + 1));
    return {
      success: true,
      data: { campaignId: campaign.id, created: inserted?.length ?? 0, runsRemainingToday },
    };
  } catch (err) {
    console.error("createCampaign failed", err);
    return { success: false, error: "No se pudo crear la campaña. Intenta de nuevo." };
  }
}

/** Marks a campaign as canceled — leaves any content_calendar pieces already generated in place (they just stop being tied to an active campaign narrative). */
export async function cancelCampaign(campaignId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("campaigns").update({ status: "cancelada" }).eq("id", campaignId);
    if (error) return { success: false, error: error.message };
    return { success: true, data: undefined };
  } catch (err) {
    console.error("cancelCampaign failed", err);
    return { success: false, error: "No se pudo cancelar la campaña." };
  }
}
