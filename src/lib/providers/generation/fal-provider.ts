import type {
  GenerationJobHandle,
  GenerationJobStatus,
  GenerationProvider,
  GenerationResult,
  ImageGenerationRequest,
  VideoGenerationRequest,
} from "./types";

/**
 * fal.ai-backed implementation of GenerationProvider (Kling 3.0 Pro /
 * Seedance 2.0 for video, selected by plan — see src/lib/plans/limits.ts).
 *
 * Uses fal.ai's standard async queue REST API: POST to submit a job, GET
 * .../status to poll, GET the base request URL for the finished output.
 * That three-step contract is fal.ai's stable, documented submission flow
 * and is implemented for real here — what is NOT independently verified
 * from this environment (no network access to fal.ai's docs) is the exact
 * model endpoint slug and input field names for each specific model below.
 * CONFIRM those against https://fal.ai/models before enabling this in
 * production — a wrong slug fails loudly (404 from fal.ai), it doesn't
 * silently misbehave, but it does mean "flip FAL_API_KEY on" alone isn't
 * enough without that one check.
 *
 * Never called from the client: this file must only be imported from
 * server-side code (route handlers, queue workers), since the key would
 * otherwise leak to the browser bundle.
 */

const QUEUE_BASE = "https://queue.fal.run";

// TODO(verify): confirm these exact slugs against fal.ai's model catalog.
const VIDEO_MODEL_SLUGS: Record<VideoGenerationRequest["provider"], { textToVideo: string; imageToVideo: string }> = {
  "kling-3.0-pro": {
    textToVideo: "fal-ai/kling-video/v3/pro/text-to-video",
    imageToVideo: "fal-ai/kling-video/v3/pro/image-to-video",
  },
  "seedance-2.0-standard-720p": {
    textToVideo: "fal-ai/bytedance/seedance/v2/text-to-video/standard",
    imageToVideo: "fal-ai/bytedance/seedance/v2/image-to-video/standard",
  },
};

// TODO(verify): no image provider is pinned per-plan yet (PlanLimits only
// defines videoProvider) — this is a reasonable general-purpose fal.ai
// text-to-image/image-edit model, but should be revisited once Frames picks
// an explicit image model the same way it pins a video model per plan.
const IMAGE_MODEL_SLUG = "fal-ai/flux/dev";
const IMAGE_EDIT_MODEL_SLUG = "fal-ai/flux/dev/image-to-image";

interface FalQueueSubmitResponse {
  request_id: string;
  status_url: string;
  response_url: string;
}

interface FalQueueStatusResponse {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED";
}

/** GenerationJobHandle only carries a single opaque providerJobId string,
 * but fal.ai's status/result URLs are namespaced by model slug — so the
 * slug is packed into the id here and unpacked in checkStatus/fetchResult,
 * instead of widening the shared GenerationJobHandle type for one provider's
 * quirk. */
function encodeJobId(modelSlug: string, requestId: string): string {
  return `${modelSlug}::${requestId}`;
}

function decodeJobId(providerJobId: string): { modelSlug: string; requestId: string } {
  const separatorIndex = providerJobId.indexOf("::");
  if (separatorIndex === -1) {
    throw new Error(`Malformed fal.ai job id: ${providerJobId}`);
  }
  return {
    modelSlug: providerJobId.slice(0, separatorIndex),
    requestId: providerJobId.slice(separatorIndex + 2),
  };
}

function mapFalStatus(status: FalQueueStatusResponse["status"]): GenerationJobStatus {
  switch (status) {
    case "IN_QUEUE":
      return "queued";
    case "IN_PROGRESS":
      return "processing";
    case "COMPLETED":
      return "completed";
  }
}

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

  private authHeaders(): HeadersInit {
    return {
      Authorization: `Key ${this.apiKey}`,
      "Content-Type": "application/json",
    };
  }

  private async submitToQueue(modelSlug: string, input: Record<string, unknown>): Promise<GenerationJobHandle> {
    const res = await fetch(`${QUEUE_BASE}/${modelSlug}`, {
      method: "POST",
      headers: this.authHeaders(),
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      throw new Error(`fal.ai submit failed (${modelSlug}): ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as FalQueueSubmitResponse;
    return { providerJobId: encodeJobId(modelSlug, data.request_id), status: "queued" };
  }

  async submitVideo(request: VideoGenerationRequest): Promise<GenerationJobHandle> {
    const slugs = VIDEO_MODEL_SLUGS[request.provider];
    const hasReference = request.referenceAssetUrls.length > 0;
    const modelSlug = hasReference ? slugs.imageToVideo : slugs.textToVideo;

    return this.submitToQueue(modelSlug, {
      prompt: `${request.brandContext}\n\n${request.prompt}`,
      duration: request.durationSeconds,
      ...(hasReference ? { image_url: request.referenceAssetUrls[0] } : {}),
    });
  }

  async submitImage(request: ImageGenerationRequest): Promise<GenerationJobHandle> {
    const hasReference = request.referenceAssetUrls.length > 0;
    const modelSlug = hasReference ? IMAGE_EDIT_MODEL_SLUG : IMAGE_MODEL_SLUG;

    return this.submitToQueue(modelSlug, {
      prompt: `${request.brandContext}\n\n${request.prompt}`,
      ...(hasReference ? { image_url: request.referenceAssetUrls[0] } : {}),
    });
  }

  async checkStatus(providerJobId: string): Promise<GenerationJobHandle> {
    const { modelSlug, requestId } = decodeJobId(providerJobId);
    const res = await fetch(`${QUEUE_BASE}/${modelSlug}/requests/${requestId}/status`, {
      headers: this.authHeaders(),
    });
    if (!res.ok) {
      throw new Error(`fal.ai status check failed (${providerJobId}): ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as FalQueueStatusResponse;
    return { providerJobId, status: mapFalStatus(data.status) };
  }

  async fetchResult(providerJobId: string): Promise<GenerationResult> {
    const { modelSlug, requestId } = decodeJobId(providerJobId);
    const res = await fetch(`${QUEUE_BASE}/${modelSlug}/requests/${requestId}`, {
      headers: this.authHeaders(),
    });
    if (!res.ok) {
      return { status: "failed", errorMessage: `fal.ai result fetch failed: ${res.status} ${await res.text()}`, costUsd: 0 };
    }
    const data = (await res.json()) as Record<string, unknown>;
    // TODO(verify): the output shape varies per model — most fal.ai media
    // models return { video: { url } } or { images: [{ url }] }. Confirm
    // the exact field for the specific models above once FAL_API_KEY is set.
    const video = data.video as { url?: string } | undefined;
    const images = data.images as { url?: string }[] | undefined;
    const outputUrl = video?.url ?? images?.[0]?.url;

    if (!outputUrl) {
      return { status: "failed", errorMessage: "fal.ai response had no recognizable output URL.", costUsd: 0 };
    }
    return { status: "completed", outputUrl, costUsd: 0 };
  }
}
