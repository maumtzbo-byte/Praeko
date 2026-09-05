import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { refreshTikTokAccessToken } from "./tiktok";
import { refreshGoogleAccessToken } from "./google-business";

/**
 * One place that answers "give me a usable access token for this
 * connection". Before this existed, only the Google Business paths checked
 * expiry and refreshed; TikTok stored a refresh_token and never used it
 * (its access tokens last ~24h, so connections silently went dead the next
 * day) and Meta stored no expiry at all.
 *
 * Requires a service-role client: social_connection_tokens deliberately has
 * no policy for end users (migration 0010), so a cookie-bound client can't
 * read it at all. Callers are expected to have already established that the
 * connection belongs to the caller's business — pass a connection id you
 * looked up through RLS, not one straight off a form.
 */

/** Refreshed a few minutes early so a token doesn't lapse mid-upload on a
 * slow video publish. */
const EXPIRY_SKEW_MS = 5 * 60 * 1000;

export type TokenResult =
  | { ok: true; accessToken: string }
  | { ok: false; reason: "not_found" | "expired_no_refresh" | "refresh_failed"; error: string };

export function isTokenExpired(expiresAt: string | null, skewMs = EXPIRY_SKEW_MS): boolean {
  // null means the platform gave no horizon (Meta does this for tokens it
  // treats as non-expiring) — absence of an expiry is not an expiry.
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() - skewMs <= Date.now();
}

export async function getValidAccessToken(
  serviceRole: SupabaseClient<Database>,
  connectionId: string,
  platform: Database["public"]["Enums"]["social_platform"],
): Promise<TokenResult> {
  const { data: tokenRow } = await serviceRole
    .from("social_connection_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("connection_id", connectionId)
    .maybeSingle();

  if (!tokenRow) {
    return { ok: false, reason: "not_found", error: "No se encontró el token de esta cuenta." };
  }

  if (!isTokenExpired(tokenRow.expires_at)) {
    return { ok: true, accessToken: tokenRow.access_token };
  }

  // Meta is the deliberate gap here: it has no refresh-token flow at all,
  // so an expired Meta token can only be fixed by the owner reconnecting.
  // Marking the connection as "error" is what surfaces that in the
  // dashboard instead of leaving them to discover it through a failed post.
  if (!tokenRow.refresh_token) {
    await serviceRole.from("social_connections").update({ status: "error" }).eq("id", connectionId);
    return {
      ok: false,
      reason: "expired_no_refresh",
      error: "La conexión expiró — vuelve a conectar esta cuenta en Redes sociales.",
    };
  }

  try {
    if (platform === "tiktok") {
      const refreshed = await refreshTikTokAccessToken(tokenRow.refresh_token);
      await serviceRole
        .from("social_connection_tokens")
        .update({
          access_token: refreshed.accessToken,
          // TikTok rotates the refresh token on each use — persist the new
          // one or the next refresh fails.
          refresh_token: refreshed.refreshToken,
          expires_at: refreshed.expiresAt,
        })
        .eq("connection_id", connectionId);
      await serviceRole.from("social_connections").update({ status: "active" }).eq("id", connectionId);
      return { ok: true, accessToken: refreshed.accessToken };
    }

    if (platform === "google_business") {
      const refreshed = await refreshGoogleAccessToken(tokenRow.refresh_token);
      await serviceRole
        .from("social_connection_tokens")
        .update({ access_token: refreshed.accessToken, expires_at: refreshed.expiresAt })
        .eq("connection_id", connectionId);
      await serviceRole.from("social_connections").update({ status: "active" }).eq("id", connectionId);
      return { ok: true, accessToken: refreshed.accessToken };
    }

    await serviceRole.from("social_connections").update({ status: "error" }).eq("id", connectionId);
    return {
      ok: false,
      reason: "expired_no_refresh",
      error: "La conexión expiró — vuelve a conectar esta cuenta en Redes sociales.",
    };
  } catch (err) {
    console.error(`Token refresh failed for connection ${connectionId} (${platform})`, err);
    await serviceRole.from("social_connections").update({ status: "error" }).eq("id", connectionId);
    return {
      ok: false,
      reason: "refresh_failed",
      error: "No se pudo renovar la conexión — vuelve a conectar esta cuenta en Redes sociales.",
    };
  }
}
