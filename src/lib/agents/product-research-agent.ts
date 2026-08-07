import type Anthropic from "@anthropic-ai/sdk";
import { getClaudeClient } from "./claude-client";

/**
 * Agente de investigación de producto (dropshipping). Two-step pipeline —
 * same shape as strategy-script-agent's researchIndustryTrends() +
 * callStrategyAgent(): a free-text web_search pass first, then a separate
 * forced-tool_use call to structure it. Combining web_search with a forced
 * tool_choice in one call doesn't work — tool_choice locks the model into
 * calling that tool on its very first turn, which preempts it from ever
 * calling web_search — so structuring has to be its own follow-up call
 * over the research findings.
 */
export interface ProductCandidate {
  name: string;
  description: string;
  /** Why this looks promising right now — the trend/demand signal found in research. */
  whyNow: string;
  /** Approximate per-unit supplier cost on AliExpress/CJ, in USD. */
  estimatedCostUsd: number;
  /** Suggested retail price in USD, sized for a healthy dropshipping margin. */
  estimatedSellPriceUsd: number;
}

export interface NicheCandidate {
  name: string;
  rationale: string;
  products: ProductCandidate[];
}

export interface ProductResearchResult {
  niches: NicheCandidate[];
  researchedAt: string;
}

const MODEL = "claude-sonnet-5";
const MAX_SEARCHES = 6;
const RESEARCH_TOOL_NAME = "submit_product_research";

function buildResearchPrompt(): string {
  return [
    "Investiga en internet qué nichos y productos específicos están funcionando AHORA MISMO para tiendas de dropshipping (fuente típica: AliExpress vía DSers).",
    "Busca señales reales y recientes: productos virales en TikTok/Instagram, tendencias de búsqueda al alza, foros y reportes de dropshippers (Reddit r/dropshipping, blogs especializados, herramientas de spy tools si aparecen citadas).",
    "Para cada candidato, prioriza: bajo riesgo de saturación total, margen viable (precio de venta razonable frente a costo típico de proveedor), producto ligero/fácil de enviar (nada frágil, peligroso, de batería grande o restringido), y una razón concreta de por qué está funcionando ahora (no una moda ya agotada).",
    "Devuelve 3 nichos distintos entre sí, con 2-3 productos concretos cada uno (nombre de producto real, no una categoría vaga). En español.",
    "Si no encuentras señales concretas y recientes para algo, no lo inventes — prefiere menos candidatos pero reales.",
  ].join("\n");
}

/** Free-text research pass, grounded in live web search — same pattern as trends-research-agent.ts. */
async function runResearchPass(client: Anthropic): Promise<string> {
  const webSearchTool = { type: "web_search_20260209" as const, name: "web_search" as const, max_uses: MAX_SEARCHES };
  const userPrompt = buildResearchPrompt();

  let message = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 2048,
    tools: [webSearchTool],
    messages: [{ role: "user", content: userPrompt }],
  });

  // See trends-research-agent.ts: a long server-tool turn can pause with
  // stop_reason "pause_turn" instead of finishing — one resume is enough
  // here too.
  if (message.stop_reason === "pause_turn") {
    message = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 2048,
      tools: [webSearchTool],
      messages: [
        { role: "user", content: userPrompt },
        { role: "assistant", content: message.content },
      ],
    });
  }

  const text = message.content
    .filter((block): block is Extract<(typeof message.content)[number], { type: "text" }> => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("La investigación de productos no devolvió hallazgos.");
  }
  return text;
}

function researchToolSchema() {
  return {
    type: "object" as const,
    properties: {
      niches: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            rationale: { type: "string", description: "Por qué este nicho, en 1-2 líneas" },
            products: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  whyNow: { type: "string" },
                  estimatedCostUsd: { type: "number" },
                  estimatedSellPriceUsd: { type: "number" },
                },
                required: ["name", "description", "whyNow", "estimatedCostUsd", "estimatedSellPriceUsd"],
                additionalProperties: false,
              },
            },
          },
          required: ["name", "rationale", "products"],
          additionalProperties: false,
        },
      },
    },
    required: ["niches"],
    additionalProperties: false,
  };
}

/** Converts the free-text research findings into the structured shape the rest of the app consumes. */
async function structureFindings(client: Anthropic, researchText: string): Promise<NicheCandidate[]> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system:
      "Conviertes hallazgos de investigación de productos de dropshipping en una lista estructurada. No agregues nichos ni productos que no estén respaldados por el texto de investigación que se te da.",
    messages: [{ role: "user", content: `Hallazgos de investigación:\n\n${researchText}` }],
    tools: [
      {
        name: RESEARCH_TOOL_NAME,
        description: "Entrega los nichos y productos candidatos estructurados.",
        input_schema: researchToolSchema(),
        strict: true,
      },
    ],
    tool_choice: { type: "tool", name: RESEARCH_TOOL_NAME },
  });

  const toolUse = message.content.find((block): block is Anthropic.ToolUseBlock => block.type === "tool_use");
  if (!toolUse) {
    throw new Error("La IA no devolvió candidatos estructurados. Intenta de nuevo.");
  }
  const raw = toolUse.input as { niches: NicheCandidate[] };
  if (!raw.niches?.length) {
    throw new Error("La IA no propuso ningún nicho.");
  }
  return raw.niches;
}

export async function researchDropshippingProducts(): Promise<ProductResearchResult> {
  const client = getClaudeClient();
  const researchText = await runResearchPass(client);
  const niches = await structureFindings(client, researchText);
  return { niches, researchedAt: new Date().toISOString() };
}
