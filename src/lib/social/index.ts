import { createMetaAdapter } from "./meta";
import { createTikTokAdapter } from "./tiktok";
import type { SocialAdapter, SocialPlatform } from "./types";

const ADAPTERS: Record<SocialPlatform, SocialAdapter> = {
  instagram: createMetaAdapter("instagram"),
  facebook: createMetaAdapter("facebook"),
  tiktok: createTikTokAdapter(),
};

export function getAdapter(platform: SocialPlatform): SocialAdapter {
  return ADAPTERS[platform];
}

export function isSocialPlatform(value: string): value is SocialPlatform {
  return value === "instagram" || value === "facebook" || value === "tiktok";
}

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  tiktok: "TikTok",
};

export type { ConnectableAccount, SocialAdapter, SocialPlatform } from "./types";
