"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import {
  requestMediaGeneration,
  checkMediaGenerationStatus,
  fetchMediaGenerationResult,
} from "@/lib/agents/creative-agent";
import { publishToSocialPlatform } from "@/lib/social/publish";
import { PLAN_LIMITS, canGenerateVideo, type PlanKey } from "@/lib/plans/limits";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

/** Kicks off the Agente Creativo for one content_calendar piece: submits an
 * async fal.ai job and records it as a `generations` row in "queued" state.
 * Doesn't wait for the media to finish — see refreshMediaGenerationStatus
 * for polling, since a video job can take minutes, well past what a server
 * action can hold a request open for. */
export async function generateMediaForContent(itemId: string): Promise<ActionResult<{ generationId: string }>> {
  try {
    // Cookie-bound client, not service-role: content_calendar's RLS policy
    // (business members only) does the ownership check for free — if this
    // user isn't on the business, the select below returns nothing.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado." };

    const { data: item } = await supabase.from("content_calendar").select("*").eq("id", itemId).single();
    if (!item) return { success: false, error: "Pieza no encontrada." };
    if (item.status !== "pendiente") {
      return { success: false, error: "Esta pieza ya no está pendiente de generación." };
    }

    const [{ data: business }, { data: brand }, { data: subscription }, { data: assets }] = await Promise.all([
      supabase.from("businesses").select("*").eq("id", item.business_id).single(),
      supabase.from("brand_profiles").select("*").eq("business_id", item.business_id).maybeSingle(),
      supabase.from("subscriptions").select("plan_key").eq("business_id", item.business_id).maybeSingle(),
      supabase
        .from("brand_assets")
        .select("storage_path")
        .eq("business_id", item.business_id)
        .in("asset_type", ["logo", "photo"])
        .limit(3),
    ]);
    if (!business) return { success: false, error: "Negocio no encontrado." };

    const planKey = (subscription?.plan_key ?? "basico") as PlanKey;
    const plan = PLAN_LIMITS[planKey];

    // Hard ceiling on paid fal.ai calls per business per month, matching the
    // plan's advertised images_per_month/videos_per_month — without this,
    // any "pendiente" piece could be generated regardless of what the
    // business already used this month.
    const periodMonth = new Date();
    periodMonth.setDate(1);
    const periodMonthStr = periodMonth.toISOString().slice(0, 10);
    const { data: usage } = await supabase
      .from("usage_counters")
      .select("images_used, videos_used, video_seconds_used")
      .eq("business_id", item.business_id)
      .eq("period_month", periodMonthStr)
      .maybeSingle();

    const requestedSeconds = item.content_kind === "video"
      ? Math.min(item.target_duration_seconds ?? plan.videoAvgSeconds, plan.videoMaxSeconds)
      : 0;

    if (item.content_kind === "video") {
      const check = canGenerateVideo(plan, {
        requestedSeconds,
        secondsUsedSoFar: usage?.video_seconds_used ?? 0,
        videosUsedSoFar: usage?.videos_used ?? 0,
      });
      if (!check.allowed) {
        return {
          success: false,
          error: `Ya usaste los videos incluidos este mes en tu plan ${plan.displayName}. Mejora tu plan o espera al próximo mes.`,
        };
      }
    } else if ((usage?.images_used ?? 0) >= plan.imagesPerMonth) {
      return {
        success: false,
        error: `Ya usaste las imágenes incluidas este mes en tu plan ${plan.displayName}. Mejora tu plan o espera al próximo mes.`,
      };
    }

    const referenceAssetUrls: string[] = [];
    for (const asset of assets ?? []) {
      const { data: signed } = await supabase.storage.from("brand-assets").createSignedUrl(asset.storage_path, 3600);
      if (signed?.signedUrl) referenceAssetUrls.push(signed.signedUrl);
    }

    const brandContext = [
      `Negocio: ${business.name}`,
      business.industry ? `Giro: ${business.industry}` : null,
      brand?.brand_tone ? `Tono de marca: ${brand.brand_tone}` : null,
    ]
      .filter(Boolean)
      .join(". ");

    let handle;
    try {
      handle = await requestMediaGeneration({
        contentKind: item.content_kind,
        topic: item.topic,
        script: item.script ?? item.topic,
        targetDurationSeconds: item.target_duration_seconds,
        brandContext,
        referenceAssetUrls,
        videoProvider: plan.videoProvider,
      });
    } catch (err) {
      console.error("requestMediaGeneration failed", err);
      const message = err instanceof Error ? err.message : "No se pudo iniciar la generación.";
      return { success: false, error: message };
    }

    const serviceRole = createServiceRoleClient();
    const { data: generation, error: insertError } = await serviceRole
      .from("generations")
      .insert({
        business_id: item.business_id,
        content_calendar_id: item.id,
        content_kind: item.content_kind,
        duration_seconds: item.target_duration_seconds ?? 0,
        provider: item.content_kind === "video" ? plan.videoProvider : "fal.ai",
        provider_job_id: handle.providerJobId,
        job_status: "queued",
      })
      .select("id")
      .single();

    if (insertError || !generation) {
      return { success: false, error: insertError?.message ?? "No se pudo registrar la generación." };
    }

    // Same "record right after the paid call succeeds" logic as
    // content_generation_runs — the fal.ai job is already queued and billed
    // for at this point regardless of what happens after. Don't fail the
    // request over a logging error.
    const { error: usageError } = await serviceRole.rpc("increment_usage_counters", {
      p_business_id: item.business_id,
      p_period_month: periodMonthStr,
      p_images_delta: item.content_kind === "imagen" ? 1 : 0,
      p_videos_delta: item.content_kind === "video" ? 1 : 0,
      p_video_seconds_delta: item.content_kind === "video" ? requestedSeconds : 0,
    });
    if (usageError) console.error("increment_usage_counters failed", usageError);

    return { success: true, data: { generationId: generation.id } };
  } catch (err) {
    console.error("generateMediaForContent failed", err);
    return { success: false, error: "No se pudo generar el contenido. Intenta de nuevo." };
  }
}

/** Polls fal.ai for one generation job and, if it just finished, writes the
 * result back — storage_path on `generations`, status "generada"/"fallida"
 * on the linked content_calendar row. Called from a "Revisar estado"
 * button rather than a background worker, since this project has no
 * queue/cron infrastructure yet (see AGENTS follow-up notes). */
export async function refreshMediaGenerationStatus(
  generationId: string,
): Promise<ActionResult<{ jobStatus: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado." };

    // Select respects RLS (business members only) — same free ownership
    // check as generateMediaForContent.
    const { data: generation } = await supabase
      .from("generations")
      .select("id, provider_job_id, content_calendar_id, job_status")
      .eq("id", generationId)
      .single();
    if (!generation || !generation.provider_job_id) {
      return { success: false, error: "Generación no encontrada." };
    }
    if (generation.job_status === "completed" || generation.job_status === "failed") {
      return { success: true, data: { jobStatus: generation.job_status } };
    }

    const serviceRole = createServiceRoleClient();

    let statusHandle;
    try {
      statusHandle = await checkMediaGenerationStatus(generation.provider_job_id);
    } catch (err) {
      console.error("checkMediaGenerationStatus failed", err);
      const message = err instanceof Error ? err.message : "No se pudo revisar el estado.";
      return { success: false, error: message };
    }

    if (statusHandle.status !== "completed") {
      await serviceRole.from("generations").update({ job_status: statusHandle.status }).eq("id", generationId);
      return { success: true, data: { jobStatus: statusHandle.status } };
    }

    let result;
    try {
      result = await fetchMediaGenerationResult(generation.provider_job_id);
    } catch (err) {
      console.error("fetchMediaGenerationResult failed", err);
      const message = err instanceof Error ? err.message : "No se pudo obtener el resultado.";
      return { success: false, error: message };
    }

    if (result.status === "failed") {
      await Promise.all([
        serviceRole.from("generations").update({ job_status: "failed" }).eq("id", generationId),
        generation.content_calendar_id
          ? serviceRole.from("content_calendar").update({ status: "fallida" }).eq("id", generation.content_calendar_id)
          : Promise.resolve(),
      ]);
      return { success: true, data: { jobStatus: "failed" } };
    }

    await Promise.all([
      serviceRole
        .from("generations")
        .update({ job_status: "completed", storage_path: result.outputUrl, cost_usd: result.costUsd })
        .eq("id", generationId),
      generation.content_calendar_id
        ? serviceRole.from("content_calendar").update({ status: "generada" }).eq("id", generation.content_calendar_id)
        : Promise.resolve(),
    ]);

    return { success: true, data: { jobStatus: "completed" } };
  } catch (err) {
    console.error("refreshMediaGenerationStatus failed", err);
    return { success: false, error: "No se pudo revisar el estado. Intenta de nuevo." };
  }
}

/** Agente de Publicación — posts a ready piece to one connected account.
 * v1 is a manual trigger (button click), not an autonomous scheduler: this
 * project has no cron/queue infrastructure yet to fire it automatically at
 * recommended_publish_time (see AGENTS follow-up notes) — the real Graph
 * API / TikTok API calls behind it are functional today. */
export async function publishContentNow(itemId: string, connectionId: string): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado." };

    const { data: item } = await supabase.from("content_calendar").select("*").eq("id", itemId).single();
    if (!item) return { success: false, error: "Pieza no encontrada." };
    if (item.status !== "generada") {
      return { success: false, error: "Esta pieza todavía no tiene contenido generado listo para publicar." };
    }

    const { data: connection } = await supabase
      .from("social_connections")
      .select("*")
      .eq("id", connectionId)
      .eq("business_id", item.business_id)
      .single();
    if (!connection) return { success: false, error: "Cuenta no encontrada." };

    const { data: generation } = await supabase
      .from("generations")
      .select("storage_path")
      .eq("content_calendar_id", itemId)
      .eq("job_status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!generation?.storage_path) {
      return { success: false, error: "No se encontró el contenido generado para esta pieza." };
    }

    const serviceRole = createServiceRoleClient();
    const { data: tokenRow } = await serviceRole
      .from("social_connection_tokens")
      .select("access_token")
      .eq("connection_id", connectionId)
      .single();
    if (!tokenRow) return { success: false, error: "No se encontró el token de esta cuenta." };

    let result;
    try {
      result = await publishToSocialPlatform(
        connection.platform,
        tokenRow.access_token,
        connection.external_account_id,
        generation.storage_path,
        item.script ?? item.topic,
        item.content_kind,
      );
    } catch (err) {
      console.error("publishToSocialPlatform failed", err);
      const message = err instanceof Error ? err.message : "No se pudo publicar.";
      return { success: false, error: message };
    }

    const { error: updateError } = await serviceRole
      .from("content_calendar")
      .update({
        status: "publicada",
        published_platform: connection.platform,
        external_post_id: result.externalPostId,
      })
      .eq("id", itemId);
    if (updateError) return { success: false, error: updateError.message };

    return { success: true, data: undefined };
  } catch (err) {
    console.error("publishContentNow failed", err);
    return { success: false, error: "No se pudo publicar. Intenta de nuevo." };
  }
}
