import { FalGenerationProvider } from "@/lib/providers/generation/fal-provider";
import type { GenerationJobHandle, GenerationResult } from "@/lib/providers/generation/types";
import type { ContentKind } from "@/lib/content/types";
import type { PlanLimits } from "@/lib/plans/limits";
import { craftVisualPrompt } from "./visual-prompt-agent";

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

  // The script is written for a human presenter to read on camera (hook /
  // development / closing) — it's not a generation prompt. craftVisualPrompt
  // translates it into what the image/video model actually needs (a visual
  // scene description, not a talking-head script) before this goes to
  // fal.ai. Falls back to the raw topic+script on any failure, so a bad
  // translation never blocks generation outright.
  const visualPrompt = await craftVisualPrompt({
    contentKind: input.contentKind,
    topic: input.topic,
    script: input.script,
    targetDurationSeconds: input.targetDurationSeconds,
    brandContext: input.brandContext,
  });

  if (input.contentKind === "video") {
    return provider.submitVideo({
      prompt: visualPrompt,
      durationSeconds: input.targetDurationSeconds ?? 10,
      referenceAssetUrls: input.referenceAssetUrls,
      brandContext: input.brandContext,
      provider: input.videoProvider,
    });
  }

  return provider.submitImage({
    prompt: visualPrompt,
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
