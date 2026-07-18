import type { ConnectableAccount, SocialAdapter } from "./types";

// TikTok for Business — OAuth v2. Unlike Meta, one authorization always
// maps to exactly one TikTok account, so listConnectableAccounts here
// simply returns a single-element array (kept as an array so the "choose
// account" step upstream doesn't need a platform-specific branch).
const AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";
const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
const USER_INFO_URL = "https://open.tiktokapis.com/v2/user/info/";

const SCOPES = ["user.info.basic", "video.publish"];

interface TikTokTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  open_id: string;
}

interface TikTokUserInfoResponse {
  data: {
    user: {
      open_id: string;
      display_name: string;
      avatar_url: string | null;
    };
  };
}

export function createTikTokAdapter(): SocialAdapter {
  return {
    isConfigured() {
      return Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET);
    },

    getAuthorizeUrl(state, redirectUri) {
      const url = new URL(AUTH_URL);
      url.searchParams.set("client_key", process.env.TIKTOK_CLIENT_KEY!);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", SCOPES.join(","));
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("state", state);
      return url.toString();
    },

    async listConnectableAccounts(code, redirectUri): Promise<ConnectableAccount[]> {
      const tokenRes = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY!,
          client_secret: process.env.TIKTOK_CLIENT_SECRET!,
          code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      });
      if (!tokenRes.ok) throw new Error(`TikTok token exchange failed: ${await tokenRes.text()}`);
      const token = (await tokenRes.json()) as TikTokTokenResponse;

      const userRes = await fetch(`${USER_INFO_URL}?fields=open_id,display_name,avatar_url`, {
        headers: { Authorization: `Bearer ${token.access_token}` },
      });
      if (!userRes.ok) throw new Error(`TikTok user info lookup failed: ${await userRes.text()}`);
      const { data } = (await userRes.json()) as TikTokUserInfoResponse;

      return [
        {
          externalAccountId: data.user.open_id,
          name: data.user.display_name,
          avatarUrl: data.user.avatar_url,
          accessToken: token.access_token,
          refreshToken: token.refresh_token,
          expiresAt: new Date(Date.now() + token.expires_in * 1000).toISOString(),
        },
      ];
    },
  };
}
