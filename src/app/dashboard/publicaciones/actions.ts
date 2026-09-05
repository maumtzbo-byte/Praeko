"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import {
  requestMediaGeneration,
  checkMediaGenerationStatus,
  fetchMediaGenerationResult,
} from "@/lib/agents/creative-agent";
import { publishToSocialPlatform } from "@/lib/social/publish";
import { getPostPermalink } from "@/lib/social/meta";
import { fetchPostInsights, type PostInsights } from "@/lib/social/insights";
import { isPublishablePlatform } from "@/lib/social";
import { getValidAccessToken } from "@/lib/social/tokens";
import { PLAN_LIMITS, monthlySecondsBudget, type PlanKey } from "@/lib/plans/limits";
import type { Database } from "@/lib/supabase/types";

// publishContentNow polls Meta's Instagram container status inline (see
// waitForInstagramContainerReady in src/lib/social/meta.ts) before it can
// return — that alone can take tens of seconds for real video. A "use
// server" actions file can only export async functions (`maxDuration`
// export here fails the build), so the route-segment duration override
// lives on src/app/dashboard/publicaciones/page.tsx instead, which Next.js
// applies to Server Actions invoked from that route.

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string; code?: "plan_limit" };

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

    const periodMonth = new Date();
    periodMonth.setDate(1);
    const periodMonthStr = periodMonth.toISOString().slice(0, 10);
    const isVideo = item.content_kind === "video";
    const requestedSeconds = isVideo
      ? Math.min(item.target_duration_seconds ?? plan.videoAvgSeconds, plan.videoMaxSeconds)
      : 0;

    // Reserve the quota *before* spending anything at fal.ai, in one atomic
    // check-and-increment (see 0023_atomic_usage_guard.sql). The previous
    // order — read counters, decide, call fal.ai, then increment — let two
    // concurrent submissions both pass a cap they were jointly about to
    // exceed, and billed for both. If the generation call below fails, the
    // reservation is handed back.
    const serviceRole = createServiceRoleClient();
    const { data: guardResult, error: guardError } = await serviceRole.rpc("check_and_increment_usage", {
      p_business_id: item.business_id,
      p_period_month: periodMonthStr,
      p_is_video: isVideo,
      p_requested_seconds: requestedSeconds,
      p_max_videos: plan.videosPerMonth,
      p_max_images: plan.imagesPerMonth,
      p_max_seconds: monthlySecondsBudget(plan),
    });

    if (guardError) {
      console.error("check_and_increment_usage failed", guardError);
      return { success: false, error: "No se pudo verificar tu límite del plan. Intenta de nuevo." };
    }
    if (guardResult !== "ok") {
      return {
        success: false,
        error: isVideo
          ? `Ya usaste los videos incluidos este mes en tu plan ${plan.displayName}.`
          : `Ya usaste las imágenes incluidas este mes en tu plan ${plan.displayName}.`,
        code: "plan_limit",
      };
    }

    /** Hands back the reservation taken above — called on every path that
     * fails after it, so a provider error doesn't quietly cost the business
     * one of the month's videos. */
    const releaseReservation = async () => {
      const { error } = await serviceRole.rpc("refund_usage_counters", {
        p_business_id: item.business_id,
        p_period_month: periodMonthStr,
        p_images_delta: isVideo ? 0 : 1,
        p_videos_delta: isVideo ? 1 : 0,
        p_video_seconds_delta: isVideo ? requestedSeconds : 0,
      });
      if (error) console.error("refund_usage_counters failed", error);
    };

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
      // Nothing was generated, so nothing should have been charged against
      // the plan.
      await releaseReservation();
      const message = err instanceof Error ? err.message : "No se pudo iniciar la generación.";
      return { success: false, error: message };
    }

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
      // The fal.ai job is queued and will be billed, but with no
      // `generations` row nothing can ever poll it or show the result — the
      // business would be paying quota for output it can't reach. Keeping
      // the reservation would charge them twice over, so it goes back.
      console.error("generations insert failed after queueing fal.ai job", insertError);
      await releaseReservation();
      return { success: false, error: insertError?.message ?? "No se pudo registrar la generación." };
    }

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
      .select("id, provider_job_id, content_calendar_id, job_status, business_id, content_kind, duration_seconds, created_at")
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
      // `.neq("job_status", "failed")` makes this the transition, not just a
      // write: only the poll that actually flips the row gets a row back,
      // so two concurrent "Revisar estado" clicks can't refund twice.
      const { data: transitioned } = await serviceRole
        .from("generations")
        .update({ job_status: "failed" })
        .eq("id", generationId)
        .neq("job_status", "failed")
        .select("id")
        .maybeSingle();

      if (generation.content_calendar_id) {
        await serviceRole.from("content_calendar").update({ status: "fallida" }).eq("id", generation.content_calendar_id);
      }

      if (transitioned) {
        // The plan's quota was reserved when this job was queued. fal.ai
        // produced nothing, so it goes back — keyed to the month the job
        // was created in, not today, so a job that fails across a month
        // boundary credits the month it was charged to.
        const chargedMonth = new Date(generation.created_at);
        chargedMonth.setDate(1);
        const isVideo = generation.content_kind === "video";
        const { error: refundError } = await serviceRole.rpc("refund_usage_counters", {
          p_business_id: generation.business_id,
          p_period_month: chargedMonth.toISOString().slice(0, 10),
          p_images_delta: isVideo ? 0 : 1,
          p_videos_delta: isVideo ? 1 : 0,
          p_video_seconds_delta: isVideo ? generation.duration_seconds : 0,
        });
        if (refundError) console.error("refund_usage_counters failed", refundError);
      }

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
    // Refreshes TikTok (its tokens last ~24h) and reports a dead Meta
    // connection as something to reconnect, instead of sending an expired
    // token to the platform and surfacing its raw error.
    const token = await getValidAccessToken(serviceRole, connectionId, connection.platform);
    if (!token.ok) return { success: false, error: token.error };
    const tokenRow = { access_token: token.accessToken };

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

    if (updateError) {
      // The post is already live on the platform at this point. Saying
      // "no se pudo publicar" here would be false and would invite a second
      // click that double-posts on a real customer's account, so the
      // message has to say what actually happened.
      console.error(`Published ${result.externalPostId} but failed to record it on content_calendar ${itemId}`, updateError);
      return {
        success: false,
        error: "La publicación sí se hizo, pero no se pudo registrar aquí. No vuelvas a publicar esta pieza — revísala en tu red social.",
      };
    }

    return { success: true, data: undefined };
  } catch (err) {
    console.error("publishContentNow failed", err);
    return { success: false, error: "No se pudo publicar. Intenta de nuevo." };
  }
}

/** "Promocionar" — returns the real permalink of an already-published post
 * so the frontend can open it in a new tab, where Meta's own native
 * Boost/Promote button already lives on the post. Facebook and Instagram
 * only (TikTok's ad tools work differently and aren't wired up yet); Frames
 * never creates or touches the ad itself. */
export async function getPromoteLink(itemId: string): Promise<ActionResult<{ url: string }>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado." };

    const { data: item } = await supabase
      .from("content_calendar")
      .select("published_platform, external_post_id, business_id")
      .eq("id", itemId)
      .single();
    if (!item) return { success: false, error: "Pieza no encontrada." };
    if (!item.external_post_id || item.published_platform === null) {
      return { success: false, error: "Esta pieza todavía no está publicada." };
    }
    if (item.published_platform !== "facebook" && item.published_platform !== "instagram") {
      return { success: false, error: "Promocionar solo está disponible para Facebook e Instagram por ahora." };
    }

    const { data: connection } = await supabase
      .from("social_connections")
      .select("id")
      .eq("business_id", item.business_id)
      .eq("platform", item.published_platform)
      .maybeSingle();
    if (!connection) return { success: false, error: "No se encontró la cuenta conectada." };

    const serviceRole = createServiceRoleClient();
    const token = await getValidAccessToken(serviceRole, connection.id, item.published_platform);
    if (!token.ok) return { success: false, error: token.error };

    try {
      const url = await getPostPermalink(token.accessToken, item.external_post_id, item.published_platform);
      return { success: true, data: { url } };
    } catch (err) {
      console.error("getPostPermalink failed", err);
      return { success: false, error: "No se pudo obtener el enlace de la publicación." };
    }
  } catch (err) {
    console.error("getPromoteLink failed", err);
    return { success: false, error: "No se pudo abrir la publicación. Intenta de nuevo." };
  }
}

export interface ContentDetail {
  contentKind: Database["public"]["Enums"]["content_kind"];
  topic: string;
  script: string | null;
  format: Database["public"]["Enums"]["content_format"];
  scheduledDate: string;
  status: Database["public"]["Enums"]["content_status"];
  /** Real fal.ai output URL (generations.storage_path already IS the full
   * URL, not a Supabase Storage path — see FalGenerationProvider) — null
   * if nothing has finished generating yet for this piece. */
  mediaUrl: string | null;
  /** Only ever populated once status is "publicada" — there's no post to
   * ask a platform about before that. null also covers "the fetch failed",
   * same fail-open-per-post reasoning as gatherPublishedPostInsights: one
   * piece's stats being unavailable is never a reason to fail the whole
   * detail view. */
  insights: PostInsights | null;
}

/** Backs the click-into-a-piece detail view (ContentDetailModal) — the
 * per-post twin of gatherPublishedPostInsights/summarizeInsights
 * (results-agent.ts), fetched on demand for exactly one piece instead of
 * the bounded batch those two power on /dashboard. */
export async function getContentDetail(itemId: string): Promise<ActionResult<ContentDetail>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "No autenticado." };

    // Cookie-bound select does the ownership check for free (RLS), same
    // pattern as every other action in this file.
    const { data: item } = await supabase.from("content_calendar").select("*").eq("id", itemId).single();
    if (!item) return { success: false, error: "Pieza no encontrada." };

    const { data: generation } = await supabase
      .from("generations")
      .select("storage_path")
      .eq("content_calendar_id", itemId)
      .eq("job_status", "completed")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let insights: PostInsights | null = null;
    if (item.status === "publicada" && item.published_platform && item.external_post_id && isPublishablePlatform(item.published_platform)) {
      const serviceRole = createServiceRoleClient();
      const { data: connection } = await serviceRole
        .from("social_connections")
        .select("id")
        .eq("business_id", item.business_id)
        .eq("platform", item.published_platform)
        .maybeSingle();
      const token = connection
        ? await getValidAccessToken(serviceRole, connection.id, item.published_platform)
        : null;

      if (token?.ok) {
        try {
          insights = await fetchPostInsights(item.published_platform, token.accessToken, item.external_post_id);
        } catch (err) {
          console.error(`fetchPostInsights failed for content_calendar ${itemId}`, err);
        }
      }
    }

    return {
      success: true,
      data: {
        contentKind: item.content_kind,
        topic: item.topic,
        script: item.script,
        format: item.format,
        scheduledDate: item.scheduled_date,
        status: item.status,
        mediaUrl: generation?.storage_path ?? null,
        insights,
      },
    };
  } catch (err) {
    console.error("getContentDetail failed", err);
    return { success: false, error: "No se pudo cargar el detalle. Intenta de nuevo." };
  }
}
