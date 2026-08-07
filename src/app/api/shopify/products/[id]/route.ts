import { ShopifyAdminClient } from "@/lib/providers/shopify/client";

/** Manual endpoint to delete a product by its numeric Shopify id — used to clear the store's default placeholder products. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = `gid://shopify/Product/${id}`;
  try {
    const client = new ShopifyAdminClient();
    await client.deleteProduct(productId);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

/** Manual endpoint for text-only updates (title/description/SEO) — no image involved, unlike the /image route. */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = `gid://shopify/Product/${id}`;
  const body = (await request.json()) as {
    title?: string;
    descriptionHtml?: string;
    seoTitle?: string;
    seoDescription?: string;
  };
  try {
    const client = new ShopifyAdminClient();
    await client.updateProduct(productId, body);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
