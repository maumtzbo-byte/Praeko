import { ShopifyAdminClient } from "@/lib/providers/shopify/client";

/**
 * Manual endpoint to attach/replace a product's photo (and optionally its
 * title/description) once a real image exists — the research/launch agents
 * only produce text, so this fills the gap until there's a dashboard upload
 * button. `id` is the numeric Shopify product id from the admin URL.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const productId = `gid://shopify/Product/${id}`;

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ ok: false, error: "Se esperaba un campo 'file' en el form-data." }, { status: 400 });
  }
  const alt = typeof formData.get("alt") === "string" ? (formData.get("alt") as string) : undefined;
  const title = typeof formData.get("title") === "string" ? (formData.get("title") as string) : undefined;
  const descriptionHtml =
    typeof formData.get("descriptionHtml") === "string" ? (formData.get("descriptionHtml") as string) : undefined;

  try {
    const client = new ShopifyAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());
    const resourceUrl = await client.uploadImage(buffer, file.name || "product.png", file.type || "image/png");
    await client.updateProduct(productId, { title, descriptionHtml, imageResourceUrl: resourceUrl, imageAlt: alt });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
