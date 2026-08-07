import { ShopifyAdminClient } from "@/lib/providers/shopify/client";

/**
 * One-shot rebrand: repaints the theme's 4 active color schemes
 * (config/settings_data.json) from Canyon's default navy/blue palette to a
 * blush-pink/mauve one, matching the K-beauty niche, and — if a `logo` file
 * is posted as multipart form-data — uploads it and sets it as the theme's
 * logo. Manual trigger, same stopgap pattern as the other /api/shopify
 * routes; the color repaint isn't meant to run more than once, but the
 * logo upload can be re-run any time to swap the logo.
 */
export async function POST(request: Request) {
  const client = new ShopifyAdminClient();
  const themeId = await client.getMainThemeId();

  let logoFilename: string | null = null;
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("logo");
    if (file instanceof File) {
      const buffer = Buffer.from(await file.arrayBuffer());
      logoFilename = await client.uploadShopFile(buffer, file.name || "logo.png", file.type || "image/png", "Elora");
    }
  }

  const raw = await client.getThemeFile(themeId, "config/settings_data.json");
  if (!raw) {
    return Response.json({ ok: false, error: "No se encontró config/settings_data.json en el tema publicado." }, { status: 500 });
  }
  // Strip the auto-generated leading /* ... */ comment block so JSON.parse works.
  const jsonStart = raw.indexOf("{");
  const settings = JSON.parse(raw.slice(jsonStart)) as {
    current: { logo?: string; logo_height?: number; logo_height_mobile?: number; color_schemes: Record<string, { settings: Record<string, string> }> };
  };

  if (logoFilename) {
    settings.current.logo = `shopify://shop_images/${logoFilename}`;
    settings.current.logo_height = 36;
    settings.current.logo_height_mobile = 28;
  }

  const CREAM = "#FFF8F3";
  const BLUSH = "#F6D9E3";
  const MAUVE = "#C97B96";
  const DEEP_ROSE = "#9C5872";
  const DEEP_ROSE_HOVER = "#7C4359";
  const CHARCOAL = "#2B2420";
  const BORDER_PINK = "#F3DCE4";
  const BORDER_PINK_DARK = "#E9C2D2";

  const schemes = settings.current.color_schemes;

  // scheme-1: main/body background (was white + navy).
  Object.assign(schemes["scheme-1"].settings, {
    background: CREAM,
    foreground: CHARCOAL,
    foreground_heading: CHARCOAL,
    primary: DEEP_ROSE,
    primary_hover: DEEP_ROSE_HOVER,
    border: BORDER_PINK,
    primary_button_background: DEEP_ROSE,
    primary_button_text: "#FFFFFF",
    primary_button_border: DEEP_ROSE,
    primary_button_hover_background: DEEP_ROSE_HOVER,
    primary_button_hover_text: "#FFFFFF",
    primary_button_hover_border: DEEP_ROSE_HOVER,
    secondary_button_text: CHARCOAL,
    secondary_button_border: CHARCOAL,
    secondary_button_hover_background: CREAM,
    secondary_button_hover_text: CHARCOAL,
    secondary_button_hover_border: CHARCOAL,
    input_text_color: CHARCOAL,
    input_border_color: MAUVE,
    selected_variant_background_color: DEEP_ROSE,
    selected_variant_border_color: DEEP_ROSE,
  });

  // scheme-2: header top bar (was near-black + light blue).
  Object.assign(schemes["scheme-2"].settings, {
    background: BLUSH,
    foreground: CHARCOAL,
    foreground_heading: CHARCOAL,
    primary: DEEP_ROSE,
    primary_hover: DEEP_ROSE_HOVER,
    border: BORDER_PINK_DARK,
    primary_button_background: DEEP_ROSE,
    primary_button_text: "#FFFFFF",
    primary_button_border: DEEP_ROSE,
    primary_button_hover_background: DEEP_ROSE_HOVER,
    primary_button_hover_text: "#FFFFFF",
    primary_button_hover_border: DEEP_ROSE_HOVER,
    secondary_button_text: CHARCOAL,
    secondary_button_border: CHARCOAL,
    secondary_button_hover_background: CREAM,
    secondary_button_hover_text: CHARCOAL,
    secondary_button_hover_border: CHARCOAL,
    input_text_color: CHARCOAL,
    input_border_color: DEEP_ROSE,
    selected_variant_background_color: DEEP_ROSE,
    selected_variant_border_color: DEEP_ROSE,
  });

  // scheme-3: announcement bar (was navy blue).
  Object.assign(schemes["scheme-3"].settings, {
    background: DEEP_ROSE,
    foreground: CREAM,
    foreground_heading: "#FFFFFF",
    primary: BLUSH,
    primary_hover: "#FFFFFF",
    border: DEEP_ROSE_HOVER,
    primary_button_background: BLUSH,
    primary_button_text: CHARCOAL,
    primary_button_border: BLUSH,
    primary_button_hover_background: "#FFFFFF",
    primary_button_hover_text: CHARCOAL,
    primary_button_hover_border: "#FFFFFF",
    secondary_button_text: CREAM,
    secondary_button_border: CREAM,
    secondary_button_hover_background: DEEP_ROSE_HOVER,
    secondary_button_hover_text: CREAM,
    secondary_button_hover_border: CREAM,
    input_text_color: CHARCOAL,
    input_border_color: BLUSH,
    selected_variant_background_color: CHARCOAL,
    selected_variant_border_color: CHARCOAL,
  });

  // scheme-4: secondary section background (was light blue-gray).
  Object.assign(schemes["scheme-4"].settings, {
    background: BLUSH,
    foreground: CHARCOAL,
    foreground_heading: CHARCOAL,
    primary: CHARCOAL,
    primary_hover: "#1A1512",
    border: BORDER_PINK_DARK,
    primary_button_background: DEEP_ROSE,
    primary_button_text: "#FFFFFF",
    primary_button_border: DEEP_ROSE,
    primary_button_hover_background: DEEP_ROSE_HOVER,
    primary_button_hover_text: "#FFFFFF",
    primary_button_hover_border: DEEP_ROSE_HOVER,
    secondary_button_text: CHARCOAL,
    secondary_button_border: CHARCOAL,
    secondary_button_hover_background: "#FFFFFF",
    secondary_button_hover_text: CHARCOAL,
    secondary_button_hover_border: CHARCOAL,
    input_background: "#F8EEF1",
    input_text_color: CHARCOAL,
    input_border_color: CHARCOAL,
    selected_variant_background_color: CHARCOAL,
    selected_variant_border_color: CHARCOAL,
  });

  await client.setThemeFile(themeId, "config/settings_data.json", JSON.stringify(settings));

  return Response.json({ ok: true, themeId, logoFilename });
}
