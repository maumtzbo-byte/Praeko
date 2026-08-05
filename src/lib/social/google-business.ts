import type { ConnectableAccount, SocialAdapter } from "./types";

/**
 * Google Business Profile — not a publishing channel like Instagram/
 * Facebook/TikTok (Frames doesn't post content here), a data source: real
 * reviews for the business's Google Maps/Search listing, readable and
 * (once a business opts in) replyable through the exact same Agente de
 * Respuestas pipeline already used for social comments.
 *
 * API access is NOT self-serve like Meta/TikTok. Using these endpoints for
 * real (beyond just minting an OAuth app) requires submitting Google's
 * Business Profile API access request — a manual review that takes at
 * least ~2 weeks and can be rejected for a thin application. This adapter
 * is written and ready for when that access is approved; it will 403
 * against real accounts until then. See docs/PHASE_1_PLAN.md or ask for
 * the exact request-form steps.
 *
 * Real-time caveat: Google's actual push mechanism for new reviews is
 * Cloud Pub/Sub (accounts.updateNotifications + a GCP topic/subscription
 * you own), not a simple webhook URL — meaningfully more infrastructure
 * than Meta's "paste a URL in the app dashboard" model, and this project
 * has no background-job runtime yet to host a Pub/Sub push endpoint's
 * always-on twin (a poller) either. So for now, reviews are fetched fresh
 * on demand (page load / manual refresh — see refreshGoogleReviews in
 * dashboard/redes-sociales/actions.ts), not on a live push. Wiring real
 * Pub/Sub push notifications later is additive, not a rewrite: it would
 * call the same fetchGoogleReviews()/processGoogleReview() path this file
 * and the community-manager-agent already use, just triggered by a webhook
 * instead of a page load.
 */

const OAUTH_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const OAUTH_TOKEN_URL = "https://oauth2.googleapis.com/token";
const ACCOUNT_MGMT_BASE = "https://mybusinessaccountmanagement.googleapis.com/v1";
const BUSINESS_INFO_BASE = "https://mybusinessbusinessinformation.googleapis.com/v1";
const REVIEWS_BASE = "https://mybusiness.googleapis.com/v4";

const SCOPES = ["https://www.googleapis.com/auth/business.manage"];

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

interface GoogleAccount {
  name: string; // "accounts/{accountId}"
  accountName: string;
}

interface GoogleLocation {
  name: string; // "locations/{locationId}"
  title: string;
}

export interface GoogleReview {
  reviewId: string;
  reviewerName: string | null;
  starRating: number | null;
  comment: string | null;
  createTime: string;
}

async function exchangeCodeForTokens(code: string, redirectUri: string): Promise<GoogleTokenResponse> {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) throw new Error(`Google token exchange failed: ${res.status} ${await res.text()}`);
  return (await res.json()) as GoogleTokenResponse;
}

/** Google access tokens expire in ~1h (vs. Meta's effectively-permanent
 * Page tokens) — unlike every other adapter here, this one can't just
 * store a token once and reuse it. Callers (see refreshGoogleReviews in
 * dashboard/redes-sociales/actions.ts) check the stored expires_at first
 * and call this to mint a new access_token from the saved refresh_token
 * before hitting any Business Profile endpoint. */
export async function refreshGoogleAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: string }> {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Google token refresh failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: number };
  return { accessToken: data.access_token, expiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString() };
}

async function listAccounts(accessToken: string): Promise<GoogleAccount[]> {
  const res = await fetch(`${ACCOUNT_MGMT_BASE}/accounts`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Google Business accounts lookup failed: ${res.status} ${await res.text()}`);
  const { accounts } = (await res.json()) as { accounts?: GoogleAccount[] };
  return accounts ?? [];
}

async function listLocations(accessToken: string, accountResourceName: string): Promise<GoogleLocation[]> {
  const url = new URL(`${BUSINESS_INFO_BASE}/${accountResourceName}/locations`);
  url.searchParams.set("readMask", "name,title");
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Google Business locations lookup failed: ${res.status} ${await res.text()}`);
  const { locations } = (await res.json()) as { locations?: GoogleLocation[] };
  return locations ?? [];
}

/** Star ratings come back as an enum string ("FIVE", "FOUR", ...), not a
 * number — the reviews list endpoint is the older v4 "My Business API"
 * (still the only one that serves review data; the newer v1 APIs above
 * only cover account/location management), and this is its native shape. */
const STAR_RATING_MAP: Record<string, number> = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
};

interface GoogleReviewApiShape {
  reviewId: string;
  reviewer?: { displayName?: string };
  starRating?: string;
  comment?: string;
  createTime: string;
}

/** resourceName is "accounts/{accountId}/locations/{locationId}" — the
 * same string stored as social_connections.external_account_id. */
export async function fetchGoogleReviews(accessToken: string, resourceName: string): Promise<GoogleReview[]> {
  const res = await fetch(`${REVIEWS_BASE}/${resourceName}/reviews`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Google reviews fetch failed: ${res.status} ${await res.text()}`);
  const { reviews } = (await res.json()) as { reviews?: GoogleReviewApiShape[] };
  return (reviews ?? []).map((r) => ({
    reviewId: r.reviewId,
    reviewerName: r.reviewer?.displayName ?? null,
    starRating: r.starRating ? (STAR_RATING_MAP[r.starRating] ?? null) : null,
    comment: r.comment ?? null,
    createTime: r.createTime,
  }));
}

/** Agente de Respuestas — reply to a Google review. Same endpoint handles
 * both creating and updating a reply (PUT is idempotent here per Google's
 * docs), so no separate "has a reply already" branch is needed. */
export async function replyToGoogleReview(
  accessToken: string,
  resourceName: string,
  reviewId: string,
  message: string,
): Promise<void> {
  const res = await fetch(`${REVIEWS_BASE}/${resourceName}/reviews/${reviewId}/reply`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ comment: message }),
  });
  if (!res.ok) throw new Error(`Google review reply failed: ${res.status} ${await res.text()}`);
}

export function createGoogleBusinessAdapter(): SocialAdapter {
  return {
    isConfigured() {
      return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    },

    getAuthorizeUrl(state, redirectUri) {
      const url = new URL(OAUTH_AUTH_URL);
      url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID!);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", SCOPES.join(" "));
      url.searchParams.set("state", state);
      // access_type=offline + prompt=consent: Google only issues a
      // refresh_token on the very first consent unless you force the
      // consent screen every time — without prompt=consent, a business
      // that had disconnected and reconnected would silently get no
      // refresh_token back and its connection would die at the first
      // access-token expiry (~1h) with no way to renew it.
      url.searchParams.set("access_type", "offline");
      url.searchParams.set("prompt", "consent");
      return url.toString();
    },

    async listConnectableAccounts(code, redirectUri): Promise<ConnectableAccount[]> {
      const token = await exchangeCodeForTokens(code, redirectUri);
      const accounts = await listAccounts(token.access_token);

      const perAccountLocations = await Promise.all(
        accounts.map(async (account) => {
          const locations = await listLocations(token.access_token, account.name);
          return locations.map((location) => ({
            // Google's own resource-name shape, kept as-is rather than a
            // synthetic id — every review/reply call needs this exact
            // "accounts/{id}/locations/{id}" string as the parent path.
            externalAccountId: `${account.name}/${location.name}`,
            name: `${location.title} (${account.accountName})`,
            avatarUrl: null,
            accessToken: token.access_token,
            refreshToken: token.refresh_token ?? null,
            expiresAt: new Date(Date.now() + token.expires_in * 1000).toISOString(),
          }));
        }),
      );

      return perAccountLocations.flat();
    },
  };
}
