import type { PlanLimits } from "@/lib/plans/limits";

/**
 * Generic "generation provider" interface. The rest of the app talks to
 * this, never to fal.ai directly — swapping Kling/Seedance for another
 * vendor later means writing a new adapter, not touching callers.
 */
export interface VideoGenerationRequest {
  prompt: string;
  durationSeconds: number;
  referenceAssetUrls: string[];
  brandContext: string;
  /** Which model to use — set from the business's plan (see plans/limits.ts),
   * not chosen freely per-call, so a business never gets a video model its
   * plan didn't pay for. */
  provider: PlanLimits["videoProvider"];
}

export interface ImageGenerationRequest {
  prompt: string;
  referenceAssetUrls: string[];
  brandContext: string;
}

export type GenerationJobStatus = "queued" | "processing" | "completed" | "failed";

export interface GenerationJobHandle {
  providerJobId: string;
  status: GenerationJobStatus;
}

export interface GenerationResult {
  status: "completed" | "failed";
  outputUrl?: string;
  /** El primer cuadro del video, cuando el proveedor lo manda.
   *
   *  Existe para la revisión visual: Claude ve imágenes, no video, y sacar
   *  cuadros de un archivo pide ffmpeg, que no corre en una función de
   *  Vercel. La miniatura ya trae la mayoría de los defectos que importan
   *  —un producto que no es el del cliente, una etiqueta con letras
   *  inventadas, una mano deforme— porque el producto está en cuadro desde
   *  el principio. No es todo, y es muchísimo mejor que nada. */
  thumbnailUrl?: string;
  errorMessage?: string;
  costUsd: number;
}

/**
 * Video generation is async by nature (minutes-long jobs, longer than an
 * edge function's execution window) — submit() enqueues and returns
 * immediately, the caller polls or waits on a provider webhook. See
 * docs/PHASE_1_PLAN.md for the concrete queueing design.
 */
export interface GenerationProvider {
  submitVideo(request: VideoGenerationRequest): Promise<GenerationJobHandle>;
  submitImage(request: ImageGenerationRequest): Promise<GenerationJobHandle>;
  checkStatus(providerJobId: string): Promise<GenerationJobHandle>;
  fetchResult(providerJobId: string): Promise<GenerationResult>;
}
