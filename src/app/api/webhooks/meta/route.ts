import { respondToInboundInteraction } from "@/lib/agents/community-manager-agent";
import { parseMetaWebhookPayload, verifyMetaWebhookSignature } from "@/lib/social/meta-webhook";

/**
 * Meta's one-time webhook verification handshake, run when the URL is
 * registered/re-registered in the app dashboard (Webhooks product).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && challenge && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

/**
 * Real-time delivery of comments/DMs Frames is subscribed to (see Agente de
 * Respuestas). No queue/cron infrastructure exists yet (see AGENTS
 * follow-up notes), so events are handled inline, synchronously, in the
 * request itself — acceptable here because each event is one Claude call
 * plus at most one Graph API call, well under Meta's delivery timeout.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  if (!verifyMetaWebhookSignature(rawBody, signature)) {
    return new Response("Invalid signature", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Bad payload", { status: 400 });
  }

  const events = parseMetaWebhookPayload(payload as Parameters<typeof parseMetaWebhookPayload>[0]);
  for (const event of events) {
    await respondToInboundInteraction(event);
  }

  return new Response("OK", { status: 200 });
}
