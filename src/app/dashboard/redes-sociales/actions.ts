"use server";

import { revalidatePath } from "next/cache";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { fetchGoogleReviews, refreshGoogleAccessToken } from "@/lib/social/google-business";
import { respondToGoogleReview } from "@/lib/agents/community-manager-agent";

type ActionResult<T = undefined> = { success: true; data: T } | { success: false; error: string };

// social_connections has no delete policy for regular users (writes are
// service-role only, see migration 0010) — this action is the only way a
// business member can remove a connection, after verifying it's theirs.
export async function disconnectSocialAccount(formData: FormData) {
  const { business } = await getCurrentBusiness();
  const connectionId = formData.get("connectionId");
  if (typeof connectionId !== "string" || !connectionId) return;

  const supabase = createServiceRoleClient();
  await supabase
    .from("social_connections")
    .delete()
    .eq("id", connectionId)
    .eq("business_id", business.id);

  revalidatePath("/dashboard/redes-sociales");
}

// Cookie-bound client, not service-role: businesses_update's RLS policy
// (business members only) does the ownership check for free.
export async function setAutoReplyEnabled(formData: FormData) {
  const { business } = await getCurrentBusiness();
  const enabled = formData.get("enabled") === "true";

  const supabase = await createClient();
  await supabase.from("businesses").update({ auto_reply_enabled: enabled }).eq("id", business.id);

  revalidatePath("/dashboard/redes-sociales");
}

/**
 * Pulls fresh reviews for the business's connected Google Business Profile
 * location. No live push exists yet (see google-business.ts for why), so
 * this is the actual "real-time data" mechanism for now: a manual
 * "Actualizar" button rather than an automatic call on every page load —
 * a live external API call on every render would add latency to a page
 * that shows plenty of other things too, and risks hitting Google's rate
 * limits on repeat visits. Every call re-fetches from Google rather than
 * trusting a cache, and new reviews get stored (and, if auto-reply is on,
 * answered) on the spot.
 */
export async function refreshGoogleReviews(): Promise<ActionResult<{ newReviews: number }>> {
  try {
    const { business } = await getCurrentBusiness();

    // Cookie-bound select does the ownership check for free (RLS), same
    // pattern as every other action here — service role only takes over
    // for the token read/write below, which regular users can't see.
    const supabase = await createClient();
    const { data: connection } = await supabase
      .from("social_connections")
      .select("id, external_account_id")
      .eq("business_id", business.id)
      .eq("platform", "google_business")
      .maybeSingle();
    if (!connection) return { success: false, error: "No hay una cuenta de Google Business Profile conectada." };

    const serviceRole = createServiceRoleClient();
    const { data: tokenRow } = await serviceRole
      .from("social_connection_tokens")
      .select("access_token, refresh_token, expires_at")
      .eq("connection_id", connection.id)
      .single();
    if (!tokenRow) return { success: false, error: "No se encontró el token de esta cuenta." };

    let accessToken = tokenRow.access_token;
    if (tokenRow.expires_at && new Date(tokenRow.expires_at) <= new Date()) {
      if (!tokenRow.refresh_token) {
        return { success: false, error: "La conexión con Google expiró — vuelve a conectarla." };
      }
      const refreshed = await refreshGoogleAccessToken(tokenRow.refresh_token);
      accessToken = refreshed.accessToken;
      await serviceRole
        .from("social_connection_tokens")
        .update({ access_token: refreshed.accessToken, expires_at: refreshed.expiresAt })
        .eq("connection_id", connection.id);
    }

    const resourceName = connection.external_account_id;
    let reviews;
    try {
      reviews = await fetchGoogleReviews(accessToken, resourceName);
    } catch (err) {
      console.error("fetchGoogleReviews failed", err);
      const message = err instanceof Error ? err.message : "No se pudieron obtener las reseñas.";
      return { success: false, error: message };
    }

    const { data: existingRows } = await serviceRole
      .from("social_interactions")
      .select("external_interaction_id")
      .eq("business_id", business.id)
      .eq("platform", "google_business");
    const existingIds = new Set((existingRows ?? []).map((r) => r.external_interaction_id));
    const newReviews = reviews.filter((r) => !existingIds.has(r.reviewId));

    // Sequential, not Promise.all: each of these can call Claude and send a
    // real reply — capping concurrency here is simpler than adding a
    // separate rate limiter, and a handful of new reviews per refresh is
    // the expected case, not hundreds.
    for (const review of newReviews) {
      await respondToGoogleReview(connection.id, resourceName, review);
    }

    revalidatePath("/dashboard/redes-sociales");
    return { success: true, data: { newReviews: newReviews.length } };
  } catch (err) {
    console.error("refreshGoogleReviews failed", err);
    return { success: false, error: "No se pudieron actualizar las reseñas. Intenta de nuevo." };
  }
}
