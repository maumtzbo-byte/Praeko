import { ShopifyAdminClient } from "@/lib/providers/shopify/client";
import type { CreatedProduct } from "@/lib/providers/shopify/types";
import type { ProductCandidate } from "./product-research-agent";

/**
 * Turns one product-research candidate into a real (but DRAFT, unpublished)
 * product in the connected Shopify store — the bridge between "the agent
 * found an idea" and "it exists in the store for a human to review". Price
 * is set to the researched sell price; sourcing/fulfillment still happens
 * manually in DSers until that integration exists (see .env.example).
 */
export async function launchProductCandidateAsDraft(
  candidate: ProductCandidate,
  nicheName: string,
): Promise<CreatedProduct> {
  const client = new ShopifyAdminClient();
  const descriptionHtml = [
    `<p>${candidate.description}</p>`,
    `<p><strong>Por qué ahora:</strong> ${candidate.whyNow}</p>`,
    `<p><em>Costo estimado de proveedor: $${candidate.estimatedCostUsd.toFixed(2)} USD.</em></p>`,
  ].join("\n");

  return client.createDraftProduct({
    title: candidate.name,
    descriptionHtml,
    priceUsd: candidate.estimatedSellPriceUsd,
    tags: ["agente-investigacion", nicheName],
  });
}
