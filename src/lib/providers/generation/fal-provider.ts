import { TARIFA_IMAGEN, TARIFA_VIDEO_POR_SEGUNDO, segundosQueAcepta } from "./tarifas";
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
 * and is implemented for real here. Model slugs, request fields, and output
 * shapes below were confirmed against fal.ai's public model docs
 * (fal.ai/models/...) — Kling 3.0 Pro and Flux dev slugs matched what was
 * already here; the Seedance 2.0 slugs did not (fixed, see below). Still
 * worth a final live smoke test once FAL_API_KEY is set, since docs can
 * drift from the deployed API.
 *
 * Never called from the client: this file must only be imported from
 * server-side code (route handlers, queue workers), since the key would
 * otherwise leak to the browser bundle.
 */

const QUEUE_BASE = "https://queue.fal.run";

const VIDEO_MODEL_SLUGS: Record<VideoGenerationRequest["provider"], { textToVideo: string; imageToVideo: string }> = {
  "kling-3.0-pro": {
    textToVideo: "fal-ai/kling-video/v3/pro/text-to-video",
    imageToVideo: "fal-ai/kling-video/v3/pro/image-to-video",
  },
  // Was "fal-ai/bytedance/seedance/v2/text-to-video/standard" — that slug
  // doesn't exist on fal.ai and would 404 on first real call. Confirmed
  // slug is "bytedance/seedance-2.0/{text-to-video,image-to-video}" (no
  // "fal-ai/" prefix, no "/standard" suffix — the standard vs. fast tier is
  // the base slug itself, "fast" tier lives at a separate .../fast/ path).
  "seedance-2.0-standard-720p": {
    textToVideo: "bytedance/seedance-2.0/text-to-video",
    imageToVideo: "bytedance/seedance-2.0/image-to-video",
  },
};

// TODO(verify): no image provider is pinned per-plan yet (PlanLimits only
// defines videoProvider) — this is a reasonable general-purpose fal.ai
// text-to-image/image-edit model, but should be revisited once Frames picks
// an explicit image model the same way it pins a video model per plan.
// Slug and "images[0].url" response shape confirmed against fal.ai docs.
const IMAGE_MODEL_SLUG = "fal-ai/flux/dev";
const IMAGE_EDIT_MODEL_SLUG = "fal-ai/flux/dev/image-to-image";

// Las tarifas viven en ./tarifas.ts: se necesitan para calcular márgenes
// y estimar muestras, y este archivo lee la llave de API, así que no puede
// importarse desde donde sea. Ver el porqué completo allá.

interface FalQueueSubmitResponse {
  request_id: string;
  status_url: string;
  response_url: string;
}

interface FalQueueStatusResponse {
  status: "IN_QUEUE" | "IN_PROGRESS" | "COMPLETED" | "FAILED";
}

/** GenerationJobHandle only carries a single opaque providerJobId string,
 * but fal.ai's status/result URLs are namespaced by model slug — so the
 * slug is packed into the id here and unpacked in checkStatus/fetchResult,
 * instead of widening the shared GenerationJobHandle type for one provider's
 * quirk. */
function encodeJobId(modelSlug: string, requestId: string, segundos?: number): string {
  const base = `${modelSlug}::${requestId}`;
  return segundos === undefined ? base : `${base}::${segundos}`;
}

/** Los segundos viajan dentro del id por la misma razón que el slug: la
 *  interfaz `GenerationProvider` solo le pasa a `fetchResult` un
 *  `providerJobId`, y sin la duración no hay forma de calcular el costo de
 *  un video cuando termina. Un id viejo sin ese tercer campo sigue
 *  funcionando; nada más se queda sin costo, que es justo como estaba
 *  todo antes. */
function decodeJobId(providerJobId: string): { modelSlug: string; requestId: string; segundos?: number } {
  const separatorIndex = providerJobId.indexOf("::");
  if (separatorIndex === -1) {
    throw new Error(`Malformed fal.ai job id: ${providerJobId}`);
  }
  const resto = providerJobId.slice(separatorIndex + 2);
  const segundoSeparador = resto.indexOf("::");
  if (segundoSeparador === -1) {
    return { modelSlug: providerJobId.slice(0, separatorIndex), requestId: resto };
  }
  const segundos = Number(resto.slice(segundoSeparador + 2));
  return {
    modelSlug: providerJobId.slice(0, separatorIndex),
    requestId: resto.slice(0, segundoSeparador),
    segundos: Number.isFinite(segundos) ? segundos : undefined,
  };
}

/** Lo que costó la generación que acaba de terminar.
 *
 *  Devuelve 0 solo cuando de verdad no se puede saber —un slug que no está
 *  en la tabla, o un id viejo sin duración—, y no como valor por omisión
 *  para todo. */
function costoUsd(modelSlug: string, segundos?: number): number {
  const porSegundo = TARIFA_VIDEO_POR_SEGUNDO[modelSlug];
  if (porSegundo !== undefined) {
    return segundos === undefined ? 0 : Number((porSegundo * segundos).toFixed(4));
  }
  if (modelSlug === IMAGE_MODEL_SLUG || modelSlug === IMAGE_EDIT_MODEL_SLUG) {
    return TARIFA_IMAGEN;
  }
  return 0;
}

/** Was missing the "FAILED" case entirely — fal.ai's queue API documents
 * four possible statuses (IN_QUEUE, IN_PROGRESS, COMPLETED, FAILED), but
 * this switch only handled three, no `default`. A real FAILED response
 * from fal.ai fell through every case and returned `undefined` at runtime
 * (TypeScript trusted the input type was exhaustive; a live API response
 * isn't bound by that). refreshMediaGenerationStatus's caller only checks
 * for "completed" / "failed" explicitly and treats anything else as "still
 * processing" — so a job fal.ai already gave up on would poll as
 * perpetually in-progress instead of ever surfacing the failure to the
 * user. The `default` below is a second layer of defense: any future
 * status string fal.ai adds now degrades to "processing" (safe: the user
 * just keeps polling) instead of `undefined` (unsafe: breaks the DB
 * write and the UI's status check silently). */
function mapFalStatus(status: FalQueueStatusResponse["status"]): GenerationJobStatus {
  switch (status) {
    case "IN_QUEUE":
      return "queued";
    case "IN_PROGRESS":
      return "processing";
    case "COMPLETED":
      return "completed";
    case "FAILED":
      return "failed";
    default:
      return "processing";
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

  private async submitToQueue(
    modelSlug: string,
    input: Record<string, unknown>,
    segundos?: number,
  ): Promise<GenerationJobHandle> {
    const res = await fetch(`${QUEUE_BASE}/${modelSlug}`, {
      method: "POST",
      headers: this.authHeaders(),
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      throw new Error(`fal.ai submit failed (${modelSlug}): ${res.status} ${await res.text()}`);
    }
    const data = (await res.json()) as FalQueueSubmitResponse;
    return { providerJobId: encodeJobId(modelSlug, data.request_id, segundos), status: "queued" };
  }

  async submitVideo(request: VideoGenerationRequest): Promise<GenerationJobHandle> {
    const slugs = VIDEO_MODEL_SLUGS[request.provider];
    const hasReference = request.referenceAssetUrls.length > 0;
    const modelSlug = hasReference ? slugs.imageToVideo : slugs.textToVideo;
    // Seedance defaults to whatever fal.ai's endpoint default is if
    // unspecified — the plan name promises 720p specifically
    // ("seedance-2.0-standard-720p"), so make that explicit instead of
    // trusting a default that fal.ai could change later.
    const isSeedance = request.provider === "seedance-2.0-standard-720p";

    // Kling no acepta más de 15 segundos: pedirle 20 no da un video corto,
    // da un error de fal.ai con el cupo del plan ya reservado. Se acota
    // aquí y no en quien llama, para que ningún camino nuevo se salte el
    // tope. El costo se calcula con los segundos ACOTADOS, que son los que
    // se van a cobrar.
    const segundos = segundosQueAcepta(request.provider, request.durationSeconds);

    return this.submitToQueue(modelSlug, {
      prompt: `${request.brandContext}\n\n${request.prompt}`,
      duration: segundos,
      ...(isSeedance ? { resolution: "720p" } : {}),
      ...(hasReference ? { image_url: request.referenceAssetUrls[0] } : {}),
    }, segundos);
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
    const { modelSlug, requestId, segundos } = decodeJobId(providerJobId);
    const res = await fetch(`${QUEUE_BASE}/${modelSlug}/requests/${requestId}`, {
      headers: this.authHeaders(),
    });
    if (!res.ok) {
      // Los dos caminos de error se quedan en 0 a propósito: fal.ai no
      // cobra un trabajo que no entregó salida.
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

    // La miniatura llega con distintos nombres según el modelo y a veces
    // no llega. Se buscan las tres formas conocidas y si no hay ninguna se
    // sigue sin ella: la revisión visual se salta el video, que es
    // exactamente como estaba antes, no un error.
    const thumbnailUrl =
      (data.thumbnail_url as string | undefined) ??
      ((data.thumbnail as { url?: string } | undefined)?.url) ??
      ((data.image as { url?: string } | undefined)?.url) ??
      (video?.url ? undefined : outputUrl);

    return { status: "completed", outputUrl, thumbnailUrl, costUsd: costoUsd(modelSlug, segundos) };
  }
}
