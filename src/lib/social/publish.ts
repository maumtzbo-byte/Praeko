import { publishToFacebookPage, publishToInstagram } from "./meta";
import { publishToTikTok } from "./tiktok";
import type { SocialPlatform } from "./types";
import type { ContentKind } from "@/lib/content/types";

/** Agente de Publicación — routes to the right platform-specific publish
 * call. Kept as one entry point so callers (the publish server action)
 * never need a platform switch of their own. */
export async function publishToSocialPlatform(
  platform: SocialPlatform,
  accessToken: string,
  externalAccountId: string,
  mediaUrl: string,
  caption: string,
  contentKind: ContentKind,
): Promise<{ externalPostId: string }> {
  switch (platform) {
    case "facebook":
      return publishToFacebookPage(accessToken, externalAccountId, mediaUrl, caption, contentKind);
    case "instagram":
      return publishToInstagram(accessToken, externalAccountId, mediaUrl, caption, contentKind);
    case "tiktok":
      return publishToTikTok(accessToken, mediaUrl, caption);
    case "google_business":
      // Not a publishing channel — see isPublishablePlatform in
      // src/lib/social/index.ts. Callers should never reach this branch;
      // it exists so the switch stays exhaustive against SocialPlatform.
      throw new Error("Google Business Profile no es un canal de publicación.");
  }
}
