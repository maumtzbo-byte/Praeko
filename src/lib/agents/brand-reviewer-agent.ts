import type Anthropic from "@anthropic-ai/sdk";
import { getClaudeClient } from "./claude-client";
import type { StrategyAgentInput, StrategyDayPlan } from "./strategy-script-agent";
import type { QualityReviewResult } from "@/lib/content/types";

/**
 * Agente Revisor de Marca (spec 1.4): a second pass over what the
 * estrategia/guionista agent just wrote, checking it actually sounds like
 * the business before it's queued for media generation. Runs as one batched
 * call per generation run (not one call per day) so reviewing a week of
 * content costs the same single extra Claude call regardless of how many
 * pieces it covers.
 */
export interface ReviewedDay {
  /** Matches the index of the day in the array passed in — lets the caller
   * zip verdicts back onto the original StrategyDayPlan without relying on
   * date/topic string matching. */
  index: number;
  result: QualityReviewResult;
  feedback: string;
}

const REVIEW_TOOL_NAME = "submit_review";

function buildSystemPrompt(): string {
  return [
    "Eres el agente revisor de marca de Frames, una plataforma de marketing con IA para negocios pequeños en México.",
    "Tu trabajo es revisar guiones ya escritos por el agente de estrategia antes de que se generen como imagen o video, y detectar cuando NO suenan como el negocio.",
    "Evalúa cada pieza contra el tono de marca, el público objetivo y los valores de marca que se te dan.",
    "Reglas:",
    "- 'aprobado': la pieza respeta el tono, es específica del negocio (no contenido genérico que serviría para cualquier negocio del mismo giro) y tiene un cierre o llamada a la acción clara.",
    "- 'necesita_revision_humana': la pieza es utilizable pero tiene un problema puntual (tono ligeramente apagado, gancho débil, dato que convendría confirmar con el dueño) — explica exactamente qué revisar.",
    "- 'rechazado': la pieza contradice el tono de marca, inventa datos específicos del negocio (precios, promociones, horarios) que no se dieron como contexto, o no tiene relación real con el negocio.",
    "- feedback siempre en español, en 1-2 frases concretas y accionables — nunca vago ('mejora el tono'), siempre específico ('el gancho es genérico, menciona el producto en la primera línea').",
    "- No reescribas el guion — solo evalúa y da feedback. La reescritura, si aplica, la hace el dueño o una siguiente corrida del agente de estrategia.",
    "Responde únicamente llamando a la herramienta proporcionada — no escribas texto fuera de la llamada.",
  ].join("\n");
}

function buildUserPrompt(days: StrategyDayPlan[], brand: StrategyAgentInput["business"], brandProfile: StrategyAgentInput["brand"]): string {
  const lines = [
    `Negocio: ${brand.name}`,
    brand.industry ? `Giro: ${brand.industry}` : null,
    brand.description ? `Descripción: ${brand.description}` : null,
    brandProfile.brandTone ? `Tono de marca: ${brandProfile.brandTone}` : null,
    brandProfile.targetAudience ? `Público objetivo: ${brandProfile.targetAudience}` : null,
    brandProfile.brandValues.length ? `Valores de marca: ${brandProfile.brandValues.join(", ")}` : null,
    brandProfile.mainProducts.length ? `Productos o servicios principales: ${brandProfile.mainProducts.join(", ")}` : null,
    "",
    "Revisa cada una de estas piezas (índice, tema y guion):",
    ...days.map(
      (day, i) => `[${i}] Tema: ${day.topic}\nGuion: ${day.script}`,
    ),
  ].filter((line): line is string => line !== null);

  return lines.join("\n");
}

function reviewSchema() {
  return {
    type: "object" as const,
    properties: {
      reviews: {
        type: "array",
        items: {
          type: "object",
          properties: {
            index: { type: "integer", description: "Índice de la pieza revisada, tal como se recibió" },
            result: {
              type: "string",
              enum: ["aprobado", "necesita_revision_humana", "rechazado"],
            },
            feedback: { type: "string", description: "1-2 frases concretas, siempre en español" },
          },
          required: ["index", "result", "feedback"],
          additionalProperties: false,
        },
      },
    },
    required: ["reviews"],
    additionalProperties: false,
  };
}

export async function reviewContentBatch(
  days: StrategyDayPlan[],
  business: StrategyAgentInput["business"],
  brand: StrategyAgentInput["brand"],
): Promise<ReviewedDay[]> {
  if (days.length === 0) return [];

  const client = getClaudeClient();

  const message = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 4000,
    system: buildSystemPrompt(),
    messages: [{ role: "user", content: buildUserPrompt(days, business, brand) }],
    tools: [
      {
        name: REVIEW_TOOL_NAME,
        description: "Entrega el veredicto de revisión para cada pieza.",
        input_schema: reviewSchema(),
        strict: true,
      },
    ],
    tool_choice: { type: "tool", name: REVIEW_TOOL_NAME },
  });

  const toolUse = message.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) {
    throw new Error("El revisor de marca no devolvió un resultado estructurado.");
  }

  const raw = toolUse.input as { reviews: ReviewedDay[] };
  return raw.reviews ?? [];
}
