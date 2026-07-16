import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/**
 * Shared Claude client for every agent (business, strategy, script, quality
 * review). Server-side only — never import this from client components.
 */
export function getClaudeClient(): Anthropic {
  if (client) return client;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set — see .env.example.");
  }

  client = new Anthropic({ apiKey });
  return client;
}
