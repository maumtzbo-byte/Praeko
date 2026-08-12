import { getClaudeClient } from "./claude-client";
import { isUsBusiness } from "@/lib/content/key-dates";

/**
 * Agente de Tendencias — real web research, not just the hardcoded
 * Mexico/US key-dates calendars (see src/lib/content/key-dates.ts, still
 * used alongside this for exact calendar dates). Uses Claude's server-side
 * web_search tool so the strategy agent can ground its content plan in
 * what's actually happening right now for this business's industry and
 * city — competitors, trending angles, current conversations — instead of
 * only ever working from the brand questionnaire.
 *
 * Deliberately NOT an OAuth connection: no business ever signs into
 * anything for this. It's Frames' own research step, billed to Frames'
 * own ANTHROPIC_API_KEY like every other agent call — nothing for a
 * dueño to set up, same as the user asked for ("para los agentes... no
 * para los clientes").
 */
export interface TrendResearchInput {
  industry: string | null;
  city: string | null;
  country: string | null;
  sellsDescription: string | null;
}

const MAX_SEARCHES = 4;
const MODEL = "claude-sonnet-5";

function buildResearchPrompt(input: TrendResearchInput): string {
  const location = [input.city, input.country].filter(Boolean).join(", ") || "México";
  // The summary language follows the business's región (see isUsBusiness)
  // rather than always Spanish — this text gets folded straight into the
  // strategy agent's prompt (see buildResearchSection in
  // strategy-script-agent.ts), which now writes the actual script/topic in
  // English for US businesses too; keeping this in Spanish for a US
  // business would just be internal-prompt language drift, not a
  // customer-facing inconsistency by itself, but matching it avoids Claude
  // ever needing to translate its own research mid-prompt.
  const isUs = isUsBusiness(input.country);
  return [
    `Investiga en internet qué tipo de contenido de redes sociales está funcionando AHORA MISMO para negocios de "${input.industry}" en ${location}${input.sellsDescription ? `, especialmente relacionados con: ${input.sellsDescription}` : ""}.`,
    "Busca: tendencias actuales de esta industria específica, temas de conversación relevantes esta semana o este mes, y cualquier evento o fecha próxima específica de esta industria (no una fecha genérica de calendario) que valga la pena aprovechar.",
    isUs
      ? "Responde con un resumen breve (máximo 5-6 líneas), en inglés (este negocio opera en Estados Unidos), solo con hallazgos concretos y accionables para este negocio — nada de relleno genérico tipo 'social media is important'. Si no encuentras nada específico y útil, dilo en una sola línea en vez de inventar algo."
      : "Responde con un resumen breve (máximo 5-6 líneas), en español, solo con hallazgos concretos y accionables para este negocio — nada de relleno genérico tipo 'las redes sociales son importantes'. Si no encuentras nada específico y útil, dilo en una sola línea en vez de inventar algo.",
  ].join("\n");
}

/**
 * Returns null (not a thrown error, not an empty string masquerading as a
 * finding) when there's nothing to search for or the search step itself
 * fails — the strategy agent already works from brand context and key
 * dates alone, so a missing research brief should degrade silently, not
 * block a business's whole content plan from generating.
 */
export async function researchIndustryTrends(input: TrendResearchInput): Promise<string | null> {
  if (!input.industry) return null;

  const client = getClaudeClient();
  const webSearchTool = { type: "web_search_20260209" as const, name: "web_search" as const, max_uses: MAX_SEARCHES };
  const userPrompt = buildResearchPrompt(input);

  try {
    let message = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 1024,
      tools: [webSearchTool],
      messages: [{ role: "user", content: userPrompt }],
    });

    // A long-running server-tool turn can stop with stop_reason
    // "pause_turn" instead of "end_turn" -- the API signaling "still
    // working," not "done." One resume is enough for a short research
    // brief like this (not an open-ended agentic task), rather than
    // building a full retry loop.
    if (message.stop_reason === "pause_turn") {
      message = await client.beta.messages.create({
        model: MODEL,
        max_tokens: 1024,
        tools: [webSearchTool],
        messages: [
          { role: "user", content: userPrompt },
          { role: "assistant", content: message.content },
        ],
      });
    }

    const summary = message.content
      .filter((block): block is Extract<(typeof message.content)[number], { type: "text" }> => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    return summary || null;
  } catch (err) {
    console.error("researchIndustryTrends failed", err);
    return null;
  }
}
