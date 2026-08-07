import { launchProductCandidateAsDraft } from "@/lib/agents/product-launch-agent";
import type { ProductCandidate } from "@/lib/agents/product-research-agent";

interface LaunchRequestBody {
  nicheName: string;
  candidate: ProductCandidate;
}

function isValidBody(body: unknown): body is LaunchRequestBody {
  if (!body || typeof body !== "object") return false;
  const b = body as Partial<LaunchRequestBody>;
  return (
    typeof b.nicheName === "string" &&
    !!b.candidate &&
    typeof b.candidate.name === "string" &&
    typeof b.candidate.description === "string" &&
    typeof b.candidate.whyNow === "string" &&
    typeof b.candidate.estimatedCostUsd === "number" &&
    typeof b.candidate.estimatedSellPriceUsd === "number"
  );
}

/**
 * Takes one candidate from GET /api/agents/product-research and creates it
 * as a draft product in Shopify. Manual step for now (paste one candidate
 * from that response as the body) — becomes a dashboard "Crear borrador"
 * button once there's a UI for this.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Body inválido: se esperaba JSON." }, { status: 400 });
  }

  if (!isValidBody(body)) {
    return Response.json(
      { ok: false, error: "Se esperaba { nicheName: string, candidate: ProductCandidate }." },
      { status: 400 },
    );
  }

  try {
    const created = await launchProductCandidateAsDraft(body.candidate, body.nicheName);
    return Response.json({ ok: true, product: created });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
