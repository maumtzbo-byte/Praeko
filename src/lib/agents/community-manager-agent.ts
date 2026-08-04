import type Anthropic from "@anthropic-ai/sdk";
import { getClaudeClient } from "./claude-client";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { replyToComment, sendDirectMessage } from "@/lib/social/meta";
import type { InteractionType, ParsedMetaEvent } from "@/lib/social/meta-webhook";

/**
 * Agente de Respuestas (spec original, nunca construido hasta ahora):
 * contesta precio, horario y disponibilidad en comentarios y DMs usando
 * SOLO lo que el dueño ya cargó en el cuestionario de marca (FAQs, horario,
 * dirección, ticket promedio, promociones) — nunca inventa un dato que no
 * se le dio. Cualquier cosa fuera de eso (quejas, negociaciones, algo que
 * requiere juicio humano) se marca para revisión en vez de arriesgar una
 * respuesta pública o a un cliente real que suene mal o esté mal.
 */
export interface CommunityManagerBrandContext {
  businessName: string;
  industry: string | null;
  brandTone: string | null;
  aiResponseStyle: string | null;
  aiForbiddenTopics: string | null;
  aiForbiddenWords: string[];
  faqs: { question: string; answer: string }[];
  businessHours: Record<string, string>;
  address: string | null;
  averageTicket: string | null;
  frequentPromotions: string | null;
  mainProducts: string[];
  sellsDescription: string | null;
  phone: string | null;
}

export interface CommunityManagerInput {
  brand: CommunityManagerBrandContext;
  interactionType: InteractionType;
  authorName: string | null;
  inboundText: string;
}

export interface CommunityManagerResult {
  shouldReply: boolean;
  replyText: string | null;
  /** Why it did or didn't reply — shown to the dueño in the "necesita revisión" log either way. */
  reason: string;
}

const REPLY_TOOL_NAME = "submit_reply_decision";

function buildSystemPrompt(): string {
  return [
    "Eres el agente de respuestas de Frames, una plataforma de marketing con IA para negocios pequeños en México.",
    "Tu trabajo es contestar comentarios y mensajes directos de Instagram/Facebook de un negocio, usando ÚNICAMENTE la información de marca que se te da.",
    "Reglas estrictas, sin excepción:",
    "- NUNCA inventes precios, horarios, disponibilidad, promociones o políticas que no estén literalmente en el contexto de marca.",
    "- Si la pregunta se puede contestar 100% con el contexto dado (precio, horario, dirección, qué venden, promoción vigente), contesta corto, directo y en el tono de marca indicado.",
    "- Si falta información para contestar con certeza, si es una queja, una negociación, algo negativo, ambiguo, spam, o cualquier cosa que requiera juicio humano, NO contestes — marca should_reply en false y explica por qué en reason, para que el dueño del negocio lo vea y responda él mismo.",
    "- Si el mensaje toca alguno de los temas prohibidos que se te dan, o usa alguna de las palabras prohibidas, NO contestes.",
    "- Un comentario es público — el mensaje debe funcionar frente a cualquiera que lo lea, no solo para quien preguntó.",
    "- Respuestas siempre en español, 1-3 frases, sin firmar con nombre de marca (ya se ve de qué cuenta viene).",
    "- reason siempre en español, 1 frase, explicando la decisión (útil tanto si contestaste como si no).",
    "Responde únicamente llamando a la herramienta proporcionada — no escribas texto fuera de la llamada.",
  ].join("\n");
}

function buildUserPrompt(input: CommunityManagerInput): string {
  const { brand } = input;
  const hoursLines = Object.entries(brand.businessHours)
    .filter(([, v]) => v)
    .map(([day, hours]) => `  ${day}: ${hours}`);

  const lines = [
    `Negocio: ${brand.businessName}`,
    brand.industry ? `Giro: ${brand.industry}` : null,
    brand.brandTone ? `Tono de marca: ${brand.brandTone}` : null,
    brand.aiResponseStyle ? `Estilo de respuesta pedido: ${brand.aiResponseStyle}` : null,
    brand.sellsDescription ? `Qué vende: ${brand.sellsDescription}` : null,
    brand.mainProducts.length ? `Productos o servicios principales: ${brand.mainProducts.join(", ")}` : null,
    brand.averageTicket ? `Ticket promedio: ${brand.averageTicket}` : null,
    brand.frequentPromotions ? `Promociones vigentes: ${brand.frequentPromotions}` : null,
    brand.address ? `Dirección: ${brand.address}` : null,
    brand.phone ? `Teléfono: ${brand.phone}` : null,
    hoursLines.length ? `Horario:\n${hoursLines.join("\n")}` : null,
    brand.faqs.length ? `Preguntas frecuentes ya definidas por el dueño:\n${brand.faqs.map((f) => `  P: ${f.question}\n  R: ${f.answer}`).join("\n")}` : null,
    brand.aiForbiddenTopics ? `Temas prohibidos (nunca contestar sobre esto): ${brand.aiForbiddenTopics}` : null,
    brand.aiForbiddenWords.length ? `Palabras prohibidas: ${brand.aiForbiddenWords.join(", ")}` : null,
    "",
    `Tipo de interacción: ${input.interactionType === "comentario" ? "comentario público" : "mensaje directo privado"}`,
    input.authorName ? `De: ${input.authorName}` : null,
    `Mensaje recibido: "${input.inboundText}"`,
  ].filter((line): line is string => line !== null);

  return lines.join("\n");
}

function replySchema() {
  return {
    type: "object" as const,
    properties: {
      should_reply: { type: "boolean" },
      reply_text: { type: ["string", "null"], description: "Solo si should_reply es true" },
      reason: { type: "string", description: "1 frase en español explicando la decisión" },
    },
    required: ["should_reply", "reply_text", "reason"],
    additionalProperties: false,
  };
}

export async function draftReply(input: CommunityManagerInput): Promise<CommunityManagerResult> {
  const client = getClaudeClient();

  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    system: buildSystemPrompt(),
    messages: [{ role: "user", content: buildUserPrompt(input) }],
    tools: [
      {
        name: REPLY_TOOL_NAME,
        description: "Entrega la decisión de si contestar y con qué texto.",
        input_schema: replySchema(),
        strict: true,
      },
    ],
    tool_choice: { type: "tool", name: REPLY_TOOL_NAME },
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) {
    throw new Error("El agente de respuestas no devolvió una decisión estructurada.");
  }

  const raw = toolUse.input as { should_reply: boolean; reply_text: string | null; reason: string };
  return { shouldReply: raw.should_reply, replyText: raw.should_reply ? raw.reply_text : null, reason: raw.reason };
}

// Hard ceiling on auto-replies per business per day — protects against a
// comment/DM storm (or a bug in the parser) turning into runaway Claude
// spend or, worse, a wall of public replies. Generous relative to the
// content-generation caps since this reacts to real customers in real
// time, not a batch the business chose to run.
const MAX_AUTO_REPLIES_PER_DAY = 50;

function parseFaqs(json: unknown): { question: string; answer: string }[] {
  if (!Array.isArray(json)) return [];
  return json.filter(
    (item): item is { question: string; answer: string } =>
      typeof item === "object" && item !== null && typeof (item as { question?: unknown }).question === "string" && typeof (item as { answer?: unknown }).answer === "string",
  );
}

function parseBusinessHours(json: unknown): Record<string, string> {
  if (typeof json !== "object" || json === null || Array.isArray(json)) return {};
  const entries = Object.entries(json as Record<string, unknown>).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0,
  );
  return Object.fromEntries(entries);
}

/**
 * Entry point called by the /api/webhooks/meta route for every parsed
 * comment/DM: looks up which business this belongs to, checks whether it
 * opted in and hasn't hit today's cap, asks the agent for a decision, sends
 * the reply through Meta if warranted, and logs the outcome either way so
 * the dueño can see what happened in Redes sociales. Never throws — a
 * failure here is a missed auto-reply, not something worth a 500 back to
 * Meta (which would just trigger a retry storm).
 */
export async function respondToInboundInteraction(event: ParsedMetaEvent): Promise<void> {
  const supabase = createServiceRoleClient();

  try {
    const { data: connection } = await supabase
      .from("social_connections")
      .select("id, business_id, external_account_id")
      .eq("platform", event.platform)
      .eq("external_account_id", event.externalAccountId)
      .maybeSingle();
    if (!connection) return; // no business has this account connected (anymore) — nothing to do

    // Checked here, before any Claude call or Meta send, not just left to
    // the unique constraint on the final insert below — Meta retries a
    // webhook delivery it didn't get a fast 200 for, and by the time an
    // insert conflict happened at the end it would be too late: the reply
    // would already have gone out a second time.
    const { data: existing } = await supabase
      .from("social_interactions")
      .select("id")
      .eq("platform", event.platform)
      .eq("external_interaction_id", event.externalInteractionId)
      .maybeSingle();
    if (existing) return;

    const [{ data: business }, { data: brand }] = await Promise.all([
      supabase.from("businesses").select("id, name, industry, phone, auto_reply_enabled").eq("id", connection.business_id).single(),
      supabase.from("brand_profiles").select("*").eq("business_id", connection.business_id).maybeSingle(),
    ]);
    if (!business || !business.auto_reply_enabled) return;

    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const { count: repliesToday } = await supabase
      .from("social_interactions")
      .select("id", { count: "exact", head: true })
      .eq("business_id", business.id)
      .eq("reply_status", "respondido")
      .gte("created_at", startOfToday.toISOString());

    if ((repliesToday ?? 0) >= MAX_AUTO_REPLIES_PER_DAY) {
      await supabase.from("social_interactions").insert({
        business_id: business.id,
        connection_id: connection.id,
        platform: event.platform,
        interaction_type: event.interactionType,
        external_interaction_id: event.externalInteractionId,
        author_name: event.authorName,
        inbound_text: event.text,
        reply_status: "necesita_revision",
      });
      return;
    }

    const brandContext: CommunityManagerBrandContext = {
      businessName: business.name,
      industry: business.industry,
      phone: business.phone,
      brandTone: brand?.brand_tone ?? null,
      aiResponseStyle: brand?.ai_response_style ?? null,
      aiForbiddenTopics: brand?.ai_forbidden_topics ?? null,
      aiForbiddenWords: brand?.ai_forbidden_words ?? [],
      faqs: parseFaqs(brand?.faqs),
      businessHours: parseBusinessHours(brand?.business_hours),
      address: brand?.address ?? null,
      averageTicket: brand?.average_ticket ?? null,
      frequentPromotions: brand?.frequent_promotions ?? null,
      mainProducts: brand?.main_products ?? [],
      sellsDescription: brand?.sells_description ?? null,
    };

    let decision: CommunityManagerResult;
    try {
      decision = await draftReply({
        brand: brandContext,
        interactionType: event.interactionType,
        authorName: event.authorName,
        inboundText: event.text,
      });
    } catch (err) {
      console.error("draftReply failed", err);
      await supabase.from("social_interactions").insert({
        business_id: business.id,
        connection_id: connection.id,
        platform: event.platform,
        interaction_type: event.interactionType,
        external_interaction_id: event.externalInteractionId,
        author_name: event.authorName,
        inbound_text: event.text,
        reply_status: "fallido",
      });
      return;
    }

    if (!decision.shouldReply || !decision.replyText) {
      await supabase.from("social_interactions").insert({
        business_id: business.id,
        connection_id: connection.id,
        platform: event.platform,
        interaction_type: event.interactionType,
        external_interaction_id: event.externalInteractionId,
        author_name: event.authorName,
        inbound_text: event.text,
        reply_status: "necesita_revision",
      });
      return;
    }

    const { data: tokenRow } = await supabase
      .from("social_connection_tokens")
      .select("access_token")
      .eq("connection_id", connection.id)
      .single();
    if (!tokenRow) {
      await supabase.from("social_interactions").insert({
        business_id: business.id,
        connection_id: connection.id,
        platform: event.platform,
        interaction_type: event.interactionType,
        external_interaction_id: event.externalInteractionId,
        author_name: event.authorName,
        inbound_text: event.text,
        reply_status: "fallido",
      });
      return;
    }

    try {
      if (event.interactionType === "comentario") {
        await replyToComment(tokenRow.access_token, event.externalInteractionId, decision.replyText);
      } else if (event.authorId) {
        // TODO(verify): confirm the unified Send API accepts the IG business
        // account id in the same /{id}/messages shape as a Facebook Page id
        // for an inbound Instagram DM — matches Meta's documented
        // Messenger-platform unification, but this project has never sent a
        // live DM reply yet to confirm against the current Graph API version.
        await sendDirectMessage(tokenRow.access_token, connection.external_account_id, event.authorId, decision.replyText);
      } else {
        throw new Error("DM sin remitente identificado.");
      }
    } catch (err) {
      console.error("Meta reply send failed", err);
      await supabase.from("social_interactions").insert({
        business_id: business.id,
        connection_id: connection.id,
        platform: event.platform,
        interaction_type: event.interactionType,
        external_interaction_id: event.externalInteractionId,
        author_name: event.authorName,
        inbound_text: event.text,
        reply_text: decision.replyText,
        reply_status: "fallido",
      });
      return;
    }

    await supabase.from("social_interactions").insert({
      business_id: business.id,
      connection_id: connection.id,
      platform: event.platform,
      interaction_type: event.interactionType,
      external_interaction_id: event.externalInteractionId,
      author_name: event.authorName,
      inbound_text: event.text,
      reply_text: decision.replyText,
      reply_status: "respondido",
    });
  } catch (err) {
    // The (platform, external_interaction_id) unique constraint turns a
    // Meta webhook retry into a benign insert conflict here — anything else
    // is logged and swallowed, since there's no session to report back to.
    console.error("respondToInboundInteraction failed", err);
  }
}
