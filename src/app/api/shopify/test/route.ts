import { ShopifyAdminClient } from "@/lib/providers/shopify/client";

/**
 * Manual smoke-test endpoint for the Shopify Admin API connection — hit it
 * in dev (`/api/shopify/test`) after setting SHOPIFY_STORE_DOMAIN and
 * SHOPIFY_ADMIN_ACCESS_TOKEN in .env.local to confirm the credentials work
 * before anything (agents, dashboard UI) is built on top of them.
 */
export async function GET() {
  try {
    const client = new ShopifyAdminClient();
    const [shop, products] = await Promise.all([client.getShopInfo(), client.listProducts(5)]);
    return Response.json({ ok: true, shop, productCount: products.length, products });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
