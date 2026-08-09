"use server";

import { createClient } from "@/lib/supabase/server";
import { generateMonthlyStrategy, type StrategyAgentInput } from "@/lib/agents/strategy-script-agent";
import { reviewContentBatch } from "@/lib/agents/brand-reviewer-agent";
import { PLAN_LIMITS, type PlanKey } from "@/lib/plans/limits";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

// Hard ceiling on paid Claude calls per business per day — protects against
// runaway spend from repeated clicks or a bug, independent of any plan.
const MAX_GENERATION_RUNS_PER_DAY = 5;

// `days` is a server-action argument, not something the UI actually lets a
// user set past 7 (see onboarding-reveal.tsx / generate-action.tsx) —
// but a server action is still a directly callable endpoint, so this caps
// what a hand-crafted request could ask for in one paid Claude call.
const MAX_DAYS_PER_REQUEST = 31;

export interface GeneratedContentPreview {
  scheduledDate: string;
  contentKind: string;
  topic: string;
  script: string;
  reviewResult: string | null;
  reviewFeedback: string | null;
}

/** Generates the next `days` of content for a business and saves them to content_calendar. */
export async function generateContentPlan(
  businessId: string,
  days = 7,
): Promise<
  ActionResult<{ created: number; runsRemainingToday: number; preview: GeneratedContentPreview[] }>
> {
  try {
    if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS_PER_REQUEST) {
      return { success: false, error: `El plan debe cubrir entre 1 y ${MAX_DAYS_PER_REQUEST} días.` };
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

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);

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
      strategy = await generateMonthlyStrategy({
        business: businessInput,
        brand: brandInput,
        plan,
        startDate: startDate.toISOString().slice(0, 10),
        days,
      });
    } catch (err) {
      console.error("generateMonthlyStrategy failed", err);
      const message = err instanceof Error ? err.message : "No se pudo generar el plan.";
      return { success: false, error: message };
    }

    // Agente Revisor de Marca: a QA pass on what the strategy agent just
    // wrote. Fails open — if the reviewer call itself errors out, the
    // content is still valid and already paid for, so it's saved as
    // "pendiente" without a review verdict rather than thrown away.
    let reviews: Awaited<ReturnType<typeof reviewContentBatch>> = [];
    try {
      reviews = await reviewContentBatch(strategy.days, businessInput, brandInput);
    } catch (err) {
      console.error("reviewContentBatch failed", err);
    }
    const reviewByIndex = new Map(reviews.map((r) => [r.index, r]));

    // The upsert below is keyed on (business_id, scheduled_date, format) —
    // the same key a piece that's already had media generated or already
    // published uses. Re-running generation for an overlapping range (the
    // 5-runs-per-day cap explicitly allows more than one call the same
    // day, and every call defaults to starting "tomorrow", so overlap is
    // the common case, not an edge case) would otherwise silently blow
    // away that row's topic/script/status — including on a piece that's
    // already live on Instagram, leaving the dashboard showing different
    // content than what's actually posted. Fetch which (date, format)
    // pairs already moved past "just a draft" and never touch those rows.
    const targetDates = strategy.days.map((d) => d.date);
    const { data: protectedRows } = await supabase
      .from("content_calendar")
      .select("scheduled_date, format")
      .eq("business_id", businessId)
      .in("scheduled_date", targetDates)
      .in("status", ["generada", "publicada"]);
    const protectedKeys = new Set((protectedRows ?? []).map((r) => `${r.scheduled_date}|${r.format}`));

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

    const rows = strategy.days
      .map((d, i) => ({ d, i }))
      .filter(({ d }) => !protectedKeys.has(`${d.date}|${d.format}`))
      .map(({ d, i }) => {
        const review = reviewByIndex.get(i);
        return {
          business_id: businessId,
          scheduled_date: d.date,
          content_kind: d.contentKind,
          format: d.format,
          topic: d.topic,
          script: d.script,
          target_duration_seconds: d.contentKind === "video" ? d.targetDurationSeconds ?? null : null,
          recommended_publish_time: d.recommendedPublishTime,
          // rechazado is still saved as en_revision, not dropped — the dueño
          // should see and decide on it, not lose it silently. A MISSING
          // review (reviewContentBatch threw, or Claude's batch response
          // omitted this index) must fail closed the same way — !review used
          // to fall through to the true branch's ":" alternative ("pendiente",
          // meaning "cleared to generate/publish automatically"), which
          // treated "the safety check never ran" the same as "the safety
          // check passed". Exactly backwards: a reviewer failure is the one
          // case that most needs a human to look before this goes further.
          status: !review || review.result !== "aprobado" ? ("en_revision" as const) : ("pendiente" as const),
          review_result: review?.result ?? null,
          review_feedback: review?.feedback ?? null,
        };
      });

    const { data: inserted, error } =
      rows.length > 0
        ? await supabase.from("content_calendar").upsert(rows, { onConflict: "business_id,scheduled_date,format" }).select("id")
        : { data: [], error: null };

    if (error) return { success: false, error: error.message };

    const runsRemainingToday = Math.max(0, MAX_GENERATION_RUNS_PER_DAY - ((runsToday ?? 0) + 1));
    const preview = strategy.days.map((d, i) => ({
      scheduledDate: d.date,
      contentKind: d.contentKind,
      topic: d.topic,
      script: d.script,
      reviewResult: reviewByIndex.get(i)?.result ?? null,
      reviewFeedback: reviewByIndex.get(i)?.feedback ?? null,
    }));
    return { success: true, data: { created: inserted?.length ?? 0, runsRemainingToday, preview } };
  } catch (err) {
    console.error("generateContentPlan failed", err);
    return { success: false, error: "No se pudo generar el plan. Intenta de nuevo." };
  }
}
