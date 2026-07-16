import type {
  GenerationJobHandle,
  GenerationProvider,
  GenerationResult,
  ImageGenerationRequest,
  VideoGenerationRequest,
} from "./types";

/**
 * fal.ai-backed implementation of GenerationProvider (Kling 3.0 Pro /
 * Seedance 2.0, selected by plan — see src/lib/plans/limits.ts).
 *
 * Stubbed until FAL_API_KEY is provided. Never called from the client:
 * this file must only be imported from server-side code (route handlers,
 * queue workers), since the key would otherwise leak to the browser bundle.
 */
export class FalGenerationProvider implements GenerationProvider {
  private readonly apiKey: string;

  constructor() {
    const apiKey = process.env.FAL_API_KEY;
    if (!apiKey) {
      throw new Error(
        "FAL_API_KEY is not set — see .env.example. FalGenerationProvider must only run server-side.",
      );
    }
    this.apiKey = apiKey;
  }

  async submitVideo(_request: VideoGenerationRequest): Promise<GenerationJobHandle> {
    throw new Error("Not implemented yet — pending fal.ai API key and queue design.");
  }

  async submitImage(_request: ImageGenerationRequest): Promise<GenerationJobHandle> {
    throw new Error("Not implemented yet — pending fal.ai API key and queue design.");
  }

  async checkStatus(_providerJobId: string): Promise<GenerationJobHandle> {
    throw new Error("Not implemented yet.");
  }

  async fetchResult(_providerJobId: string): Promise<GenerationResult> {
    throw new Error("Not implemented yet.");
  }
}
