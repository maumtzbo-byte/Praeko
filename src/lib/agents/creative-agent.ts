import { FalGenerationProvider } from "@/lib/providers/generation/fal-provider";
import type { GenerationJobHandle, GenerationResult } from "@/lib/providers/generation/types";
import type { ContentKind } from "@/lib/content/types";
import type { PlanLimits } from "@/lib/plans/limits";

/**
 * Agente Creativo: turns an approved script from the estrategia/guionista
 * agent into an actual media generation job. Stays a thin pass-through to
 * the configured GenerationProvider (fal.ai today) — the orchestration
 * around it (loading the content_calendar row, brand assets, and writing
 * the `generations` row) lives in the server action that calls this, not
 * here, so this file has zero Supabase dependency and can be unit-tested
 * or swapped in isolation.
 */
export interface CreativeAgentInput {
  contentKind: ContentKind;
  topic: string;
  script: string;
  targetDurationSeconds: number | null;
  /** Short business + brand-tone summary, prepended to the prompt so
   * generated media reads as "this business", not generic stock content. */
  brandContext: string;
  referenceAssetUrls: string[];
  videoProvider: PlanLimits["videoProvider"];
}

function getProvider() {
  return new FalGenerationProvider();
}

export async function requestMediaGeneration(input: CreativeAgentInput): Promise<GenerationJobHandle> {
  const provider = getProvider();

  if (input.contentKind === "video") {
    return provider.submitVideo({
      prompt: `${input.topic}\n\n${input.script}`,
      durationSeconds: input.targetDurationSeconds ?? 10,
      referenceAssetUrls: input.referenceAssetUrls,
      brandContext: input.brandContext,
      provider: input.videoProvider,
    });
  }

  return provider.submitImage({
    prompt: `${input.topic}\n\n${input.script}`,
    referenceAssetUrls: input.referenceAssetUrls,
    brandContext: input.brandContext,
  });
}

export async function checkMediaGenerationStatus(providerJobId: string): Promise<GenerationJobHandle> {
  return getProvider().checkStatus(providerJobId);
}

export async function fetchMediaGenerationResult(providerJobId: string): Promise<GenerationResult> {
  return getProvider().fetchResult(providerJobId);
}
