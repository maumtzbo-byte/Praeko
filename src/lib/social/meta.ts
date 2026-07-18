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

const BASE_SCOPES = ["pages_show_list", "pages_read_engagement", "pages_manage_posts", "business_management"];
const INSTAGRAM_SCOPES = [...BASE_SCOPES, "instagram_basic", "instagram_content_publish"];

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

export function createMetaAdapter(platform: "instagram" | "facebook"): SocialAdapter {
  return {
    isConfigured() {
      return Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET);
    },

    getAuthorizeUrl(state, redirectUri) {
      const url = new URL(AUTH_URL);
      url.searchParams.set("client_id", process.env.META_APP_ID!);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("state", state);
      url.searchParams.set("scope", (platform === "instagram" ? INSTAGRAM_SCOPES : BASE_SCOPES).join(","));
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
