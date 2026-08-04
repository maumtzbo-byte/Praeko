import { createHmac, timingSafeEqual } from "crypto";

/**
 * Meta signs every webhook POST body with the app secret (X-Hub-Signature-256).
 * Verifying it is what stops anyone who finds this URL from posting fake
 * "a customer asked X" events and getting Frames to auto-reply on a
 * business's real Page/Instagram with whatever the attacker wants —
 * unlike the OAuth callback (protected by a state cookie only the real
 * browser session has), this endpoint has no session at all, so the
 * signature is the only thing standing between it and the open internet.
 */
export function verifyMetaWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;
  const appSecret = process.env.META_APP_SECRET;
  if (!appSecret) return false;

  const expectedHex = createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex");
  const providedHex = signatureHeader.slice("sha256=".length);

  const expected = Buffer.from(expectedHex, "hex");
  const provided = Buffer.from(providedHex, "hex");
  if (expected.length !== provided.length) return false;
  return timingSafeEqual(expected, provided);
}

export type InteractionType = "comentario" | "mensaje_directo";

export interface ParsedMetaEvent {
  /** "instagram" or "facebook" — matches social_connections.platform. */
  platform: "instagram" | "facebook";
  /** The Page id (facebook) or IG business account id (instagram) this event arrived on — matches social_connections.external_account_id. */
  externalAccountId: string;
  interactionType: InteractionType;
  /** comment id or message id — used for the (platform, external_interaction_id) dedupe constraint, since Meta retries undelivered webhooks. */
  externalInteractionId: string;
  authorId: string | null;
  authorName: string | null;
  text: string;
}

// Meta's webhook payload is deep, loosely-typed JSON from an external
// source — these are narrow shapes for only the fields this parser reads,
// not a full schema. Every field access below is optional-chained, so a
// shape Meta changes or an event type this doesn't handle just yields no
// parsed events rather than throwing.
interface MetaWebhookEntry {
  id?: string;
  changes?: {
    field?: string;
    value?: {
      item?: string;
      comment_id?: string;
      id?: string;
      text?: string;
      message?: string;
      from?: { id?: string; name?: string; username?: string };
    };
  }[];
  messaging?: {
    sender?: { id?: string };
    message?: { mid?: string; text?: string; is_echo?: boolean };
  }[];
}

interface MetaWebhookPayload {
  object?: string;
  entry?: MetaWebhookEntry[];
}

/** Turns one raw Meta webhook delivery into a flat list of interactions worth considering — comment adds and inbound DMs, everything else (likes, echoes of our own messages, edits) dropped. */
export function parseMetaWebhookPayload(payload: MetaWebhookPayload): ParsedMetaEvent[] {
  const platform = payload.object === "instagram" ? "instagram" : payload.object === "page" ? "facebook" : null;
  if (!platform) return [];

  const events: ParsedMetaEvent[] = [];

  for (const entry of payload.entry ?? []) {
    const externalAccountId = entry.id;
    if (!externalAccountId) continue;

    for (const change of entry.changes ?? []) {
      if (change.field !== "feed" && change.field !== "comments") continue;
      const value = change.value;
      if (!value) continue;
      if (change.field === "feed" && value.item !== "comment") continue; // page feed changes cover more than just comments (likes, shares, edits)

      const text = value.text ?? value.message;
      const externalInteractionId = value.comment_id ?? value.id;
      if (!text || !externalInteractionId) continue;

      events.push({
        platform,
        externalAccountId,
        interactionType: "comentario",
        externalInteractionId,
        authorId: value.from?.id ?? null,
        authorName: value.from?.name ?? value.from?.username ?? null,
        text,
      });
    }

    for (const message of entry.messaging ?? []) {
      // is_echo marks a message the Page itself sent (e.g. this same auto-reply
      // system, or a human agent) echoed back through the same webhook —
      // without this check every auto-reply would trigger a "new DM" event
      // about itself.
      if (message.message?.is_echo) continue;
      const senderId = message.sender?.id;
      const text = message.message?.text;
      const externalInteractionId = message.message?.mid;
      if (!senderId || !text || !externalInteractionId) continue;

      events.push({
        platform,
        externalAccountId,
        interactionType: "mensaje_directo",
        externalInteractionId,
        authorId: senderId,
        authorName: null,
        text,
      });
    }
  }

  return events;
}
