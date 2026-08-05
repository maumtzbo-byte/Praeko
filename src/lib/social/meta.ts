import type { ConnectableAccount, SocialAdapter } from "./types";

// Meta Graph API — shared by Instagram and Facebook, since both go through
// the same Facebook Login dialog and the same app credentials. Instagram
// Business accounts are always reached *through* a connected Facebook Page
// (there's no standalone "Instagram login"), so both platforms list the
// user's Pages and differ only in which field they read off each one.
const GRAPH_VERSION = "v21.0";
const AUTH_URL = `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`;
const TOKEN_URL = `https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`;
const PAGES_URL = `https://graph.facebook.com/${GRAPH_VERSION}/me/accounts`;

// Business-type apps use "Facebook Login for Business", which authorizes
// via a saved Configuration (built in the Meta dashboard: Facebook Login →
// Configuraciones) instead of a freeform scope list — passing `scope`
// alone on this app type fails the dialog outright. One configuration
// bundling both Pages and Instagram permissions covers both platforms
// here, so there's no need for a separate id per platform. The
// Configuration itself must grant: pages_show_list, pages_read_engagement,
// pages_manage_posts, business_management, instagram_basic,
// instagram_content_publish.
const CONFIG_ID = process.env.META_CONFIG_ID;

interface MetaPage {
  id: string;
  name: string;
  access_token: string;
  picture?: { data?: { url?: string } };
  instagram_business_account?: {
    id: string;
    username: string;
    profile_picture_url?: string;
  };
}

async function exchangeCodeForUserToken(code: string, redirectUri: string): Promise<string> {
  const url = new URL(TOKEN_URL);
  url.searchParams.set("client_id", process.env.META_APP_ID!);
  url.searchParams.set("client_secret", process.env.META_APP_SECRET!);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code", code);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Meta token exchange failed: ${await res.text()}`);
  const { access_token } = (await res.json()) as { access_token: string };
  return access_token;
}

/** Page access tokens minted from a long-lived user token are themselves
 * long-lived (don't expire on their own timer), so we upgrade before
 * listing Pages rather than storing a short-lived (~1h) user token. */
async function exchangeForLongLivedToken(shortLivedToken: string): Promise<string> {
  const url = new URL(TOKEN_URL);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", process.env.META_APP_ID!);
  url.searchParams.set("client_secret", process.env.META_APP_SECRET!);
  url.searchParams.set("fb_exchange_token", shortLivedToken);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Meta long-lived token exchange failed: ${await res.text()}`);
  const { access_token } = (await res.json()) as { access_token: string };
  return access_token;
}

async function listPages(userToken: string): Promise<MetaPage[]> {
  const url = new URL(PAGES_URL);
  url.searchParams.set("access_token", userToken);
  url.searchParams.set("fields", "id,name,access_token,picture{url},instagram_business_account{id,username,profile_picture_url}");
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Meta pages lookup failed: ${await res.text()}`);
  const { data } = (await res.json()) as { data: MetaPage[] };
  return data;
}

/**
 * Agente de Publicación — Facebook Page post. Photos and videos use
 * different Graph API endpoints; both take a hosted media URL (fal.ai's
 * signed output URL, or our own storage) rather than an uploaded file, so
 * this stays a single request instead of a multipart upload.
 */
export async function publishToFacebookPage(
  pageAccessToken: string,
  pageId: string,
  mediaUrl: string,
  caption: string,
  contentKind: "imagen" | "video",
): Promise<{ externalPostId: string }> {
  const endpoint = `https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/${contentKind === "video" ? "videos" : "photos"}`;
  const body = new URLSearchParams({
    access_token: pageAccessToken,
    ...(contentKind === "video" ? { file_url: mediaUrl, description: caption } : { url: mediaUrl, caption }),
  });
  const res = await fetch(endpoint, { method: "POST", body });
  if (!res.ok) throw new Error(`Facebook publish failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { id?: string; post_id?: string };
  const externalPostId = data.post_id ?? data.id;
  if (!externalPostId) throw new Error("Facebook publish returned no post id.");
  return { externalPostId };
}

/** Polls an Instagram media container until Meta finishes processing it —
 * required before publishing video (Reels), per Meta's documented
 * container lifecycle (status_code field/values confirmed against current
 * Graph API docs: IN_PROGRESS, FINISHED, PUBLISHED, EXPIRED, ERROR). Meta
 * itself recommends polling roughly once a minute for up to 5 minutes —
 * this polls faster (every 4s) since it's bounded by the caller's
 * serverless function duration, not by Meta's rate limits; 45s total
 * (maxDuration=60 on the calling action, see publicaciones/actions.ts)
 * leaves headroom for the create/publish calls and DB writes around this.
 * A container that isn't ready after that either needs a longer video or
 * genuinely failed — either way the caller surfaces a clear error instead
 * of the request just hanging past the platform's function timeout. */
async function waitForInstagramContainerReady(pageAccessToken: string, creationId: string, maxAttempts = 11): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const statusUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${creationId}`);
    statusUrl.searchParams.set("fields", "status_code");
    statusUrl.searchParams.set("access_token", pageAccessToken);
    const res = await fetch(statusUrl.toString());
    if (res.ok) {
      const { status_code } = (await res.json()) as { status_code?: string };
      if (status_code === "FINISHED") return;
      if (status_code === "ERROR") throw new Error("El contenedor de Instagram falló al procesar el video.");
    }
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }
  throw new Error("El contenedor de Instagram tardó demasiado en procesar el video.");
}

/** Agente de Publicación — Instagram post via the linked Page's access
 * token (see listConnectableAccounts above for why: there's no separate
 * IG-only token). Two-step create-then-publish flow per the Graph API. */
export async function publishToInstagram(
  pageAccessToken: string,
  igUserId: string,
  mediaUrl: string,
  caption: string,
  contentKind: "imagen" | "video",
): Promise<{ externalPostId: string }> {
  const createUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${igUserId}/media`);
  createUrl.searchParams.set("access_token", pageAccessToken);
  createUrl.searchParams.set("caption", caption);
  if (contentKind === "video") {
    createUrl.searchParams.set("media_type", "REELS");
    createUrl.searchParams.set("video_url", mediaUrl);
  } else {
    createUrl.searchParams.set("image_url", mediaUrl);
  }

  const createRes = await fetch(createUrl.toString(), { method: "POST" });
  if (!createRes.ok) throw new Error(`Instagram media create failed: ${createRes.status} ${await createRes.text()}`);
  const { id: creationId } = (await createRes.json()) as { id: string };

  if (contentKind === "video") {
    await waitForInstagramContainerReady(pageAccessToken, creationId);
  }

  const publishUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${igUserId}/media_publish`);
  publishUrl.searchParams.set("access_token", pageAccessToken);
  publishUrl.searchParams.set("creation_id", creationId);
  const publishRes = await fetch(publishUrl.toString(), { method: "POST" });
  if (!publishRes.ok) throw new Error(`Instagram publish failed: ${publishRes.status} ${await publishRes.text()}`);
  const { id: externalPostId } = (await publishRes.json()) as { id: string };
  return { externalPostId };
}

/** "Promocionar" button — the real permalink for an already-published post
 * or media, so the dueño lands on the exact post where Meta's own native
 * Boost/Promote button already lives, instead of Frames trying to
 * reconstruct (and keep working) Meta's own ad-creation deep link. Frames
 * never touches the ad itself — no ads_management permission, no spend, no
 * cut of anything; this is just a doorway to a page Meta already built. */
export async function getPostPermalink(
  pageAccessToken: string,
  postId: string,
  platform: "facebook" | "instagram",
): Promise<string> {
  const field = platform === "facebook" ? "permalink_url" : "permalink";
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${postId}`);
  url.searchParams.set("fields", field);
  url.searchParams.set("access_token", pageAccessToken);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Meta permalink lookup failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as Record<string, string | undefined>;
  const permalink = data[field];
  if (!permalink) throw new Error("Meta no devolvió el enlace de la publicación.");
  return permalink;
}

/** Agente de Respuestas — reply to a public comment (works for both
 * Instagram and Facebook Page comments, same endpoint shape on the Graph API). */
export async function replyToComment(
  pageAccessToken: string,
  commentId: string,
  message: string,
): Promise<{ externalReplyId: string }> {
  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${commentId}/comments`;
  const body = new URLSearchParams({ access_token: pageAccessToken, message });
  const res = await fetch(url, { method: "POST", body });
  if (!res.ok) throw new Error(`Meta comment reply failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { id?: string };
  if (!data.id) throw new Error("Meta comment reply returned no id.");
  return { externalReplyId: data.id };
}

/** Agente de Respuestas — reply to a DM. Meta's Send API is unified across
 * Messenger and Instagram messaging: always POST to the connected Page's
 * /messages endpoint with the Page access token, whether the original
 * message came in as a Facebook or an Instagram DM. */
export async function sendDirectMessage(
  pageAccessToken: string,
  pageId: string,
  recipientId: string,
  message: string,
): Promise<{ externalMessageId: string }> {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${pageId}/messages`);
  url.searchParams.set("access_token", pageAccessToken);
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipient: { id: recipientId },
      message: { text: message },
      messaging_type: "RESPONSE",
    }),
  });
  if (!res.ok) throw new Error(`Meta DM send failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { message_id?: string };
  if (!data.message_id) throw new Error("Meta DM send returned no message id.");
  return { externalMessageId: data.message_id };
}

export function createMetaAdapter(platform: "instagram" | "facebook"): SocialAdapter {
  return {
    isConfigured() {
      return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET && CONFIG_ID);
    },

    getAuthorizeUrl(state, redirectUri) {
      const url = new URL(AUTH_URL);
      url.searchParams.set("client_id", process.env.META_APP_ID!);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("state", state);
      url.searchParams.set("config_id", CONFIG_ID!);
      return url.toString();
    },

    async listConnectableAccounts(code, redirectUri): Promise<ConnectableAccount[]> {
      const shortLivedToken = await exchangeCodeForUserToken(code, redirectUri);
      const userToken = await exchangeForLongLivedToken(shortLivedToken);
      const pages = await listPages(userToken);

      if (platform === "facebook") {
        return pages.map((page) => ({
          externalAccountId: page.id,
          name: page.name,
          avatarUrl: page.picture?.data?.url ?? null,
          accessToken: page.access_token,
          refreshToken: null,
          expiresAt: null,
        }));
      }

      return pages
        .filter((page): page is MetaPage & { instagram_business_account: NonNullable<MetaPage["instagram_business_account"]> } =>
          Boolean(page.instagram_business_account),
        )
        .map((page) => ({
          externalAccountId: page.instagram_business_account.id,
          name: `@${page.instagram_business_account.username}`,
          avatarUrl: page.instagram_business_account.profile_picture_url ?? null,
          // Instagram publishing through the Graph API is authenticated
          // with the linked Page's access token, not a separate IG token.
          accessToken: page.access_token,
          refreshToken: null,
          expiresAt: null,
        }));
    },
  };
}
