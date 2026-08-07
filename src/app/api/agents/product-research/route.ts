import { researchDropshippingProducts } from "@/lib/agents/product-research-agent";

/**
 * Manual trigger for the product research agent — hit it in dev
 * (`/api/agents/product-research`) to see the current niche/product
 * candidates before this gets wired into a scheduled job or a dashboard UI.
 */
export async function GET() {
  try {
    const result = await researchDropshippingProducts();
    return Response.json(result);
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
