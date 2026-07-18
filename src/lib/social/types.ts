import type { Database } from "@/lib/supabase/types";

export type SocialPlatform = Database["public"]["Enums"]["social_platform"];

export interface ConnectableAccount {
  externalAccountId: string;
  name: string;
  avatarUrl: string | null;
  accessToken: string;
  refreshToken: string | null;
  expiresAt: string | null;
}

export interface SocialAdapter {
  isConfigured(): boolean;
  getAuthorizeUrl(state: string, redirectUri: string): string;
  /**
   * Exchanges the OAuth code for every account the user could connect.
   * Almost always one entry — except Meta, where a user can have several
   * Facebook Pages (and, for Instagram, several linked Business accounts)
   * to choose from. Returning an array for every platform means the
   * "choose account" step never needs a platform-specific branch.
   */
  listConnectableAccounts(code: string, redirectUri: string): Promise<ConnectableAccount[]>;
}
