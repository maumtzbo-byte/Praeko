import { createMetaAdapter } from "./meta";
import { createTikTokAdapter } from "./tiktok";
import { createGoogleBusinessAdapter } from "./google-business";
import type { SocialAdapter, SocialPlatform } from "./types";

const ADAPTERS: Record<SocialPlatform, SocialAdapter> = {
  instagram: createMetaAdapter("instagram"),
  facebook: createMetaAdapter("facebook"),
  tiktok: createTikTokAdapter(),
  google_business: createGoogleBusinessAdapter(),
};

export function getAdapter(platform: SocialPlatform): SocialAdapter {
  return ADAPTERS[platform];
}

export function isSocialPlatform(value: string): value is SocialPlatform {
  return value === "instagram" || value === "facebook" || value === "tiktok" || value === "google_business";
}

// Google Business Profile is a data source (reviews), not a publishing
// channel — it shouldn't compete with Instagram/Facebook/TikTok for a
// plan's social_network_limit slot. See start/route.ts for where this is
// checked.
export function isPublishablePlatform(platform: SocialPlatform): boolean {
  return platform !== "google_business";
}

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
  google_business: "Google Business Profile",
};

export type { ConnectableAccount, SocialAdapter, SocialPlatform } from "./types";
