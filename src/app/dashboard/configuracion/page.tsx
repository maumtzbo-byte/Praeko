import { createClient } from "@/lib/supabase/server";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsTabs, type SettingsInitialData } from "@/components/settings/settings-tabs";
import type { NotificationPreferences } from "@/app/dashboard/configuracion/actions";

export default async function ConfiguracionPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const { business } = await getCurrentBusiness();
  const supabase = await createClient();

  const { data: brandProfile } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("business_id", business.id)
    .maybeSingle();

  const { data: logoAsset } = await supabase
    .from("brand_assets")
    .select("storage_path")
    .eq("business_id", business.id)
    .eq("asset_type", "logo")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let logoUrl: string | null = null;
  if (logoAsset) {
    const { data: signed } = await supabase.storage
      .from("brand-assets")
      .createSignedUrl(logoAsset.storage_path, 3600);
    logoUrl = signed?.signedUrl ?? null;
  }

  const socialLinks = (brandProfile?.social_links ?? {}) as Record<string, string>;
  const otherSocialLinks = (brandProfile?.other_social_links ?? []) as { label: string; url: string }[];
  const faqs = (brandProfile?.faqs ?? []) as { question: string; answer: string }[];
  const businessHours = (brandProfile?.business_hours ?? {}) as { general?: string };
  const notificationPreferences = (business.notification_preferences ?? {}) as Partial<NotificationPreferences>;

  const initial: SettingsInitialData = {
    businessId: business.id,
    logoUrl,
    general: {
      name: business.name,
      description: business.description ?? "",
      industry: business.industry ?? "",
      country: business.country ?? "",
      city: business.city ?? "",
      primaryLanguage: business.primary_language ?? "",
      websiteUrl: business.website_url ?? "",
      phone: business.phone ?? "",
      contactEmail: business.contact_email ?? "",
    },
    marca: {
      colorPalette: brandProfile?.color_palette ?? [],
      preferredFonts: brandProfile?.preferred_fonts ?? [],
      brandTone: brandProfile?.brand_tone ?? "",
      brandValues: brandProfile?.brand_values ?? [],
      mission: brandProfile?.mission ?? "",
      targetAudience: brandProfile?.target_audience ?? "",
    },
    redes: {
      instagram: socialLinks.instagram ?? "",
      facebook: socialLinks.facebook ?? "",
      tiktok: socialLinks.tiktok ?? "",
      linkedin: socialLinks.linkedin ?? "",
      x: socialLinks.x ?? "",
      youtube: socialLinks.youtube ?? "",
      other: otherSocialLinks,
    },
    objetivos: {
      goals: brandProfile?.goals ?? [],
      goalsOther: brandProfile?.goals_other ?? "",
    },
    competencia: {
      mainCompetitors: brandProfile?.main_competitors ?? [],
      admiredCompanies: brandProfile?.admired_companies ?? [],
      styleReferences: brandProfile?.style_references ?? [],
    },
    productos: {
      sellsDescription: brandProfile?.sells_description ?? "",
      productCategories: brandProfile?.product_categories ?? [],
      mainProducts: brandProfile?.main_products ?? [],
      averageTicket: brandProfile?.average_ticket ?? "",
      frequentPromotions: brandProfile?.frequent_promotions ?? "",
    },
    ia: {
      personality: brandProfile?.personality ?? "",
      aiForbiddenTopics: brandProfile?.ai_forbidden_topics ?? "",
      aiForbiddenWords: brandProfile?.ai_forbidden_words ?? [],
      aiResponseStyle: brandProfile?.ai_response_style ?? "",
      faqs,
      businessHours: businessHours.general ?? "",
      address: brandProfile?.address ?? "",
      additionalInfo: brandProfile?.additional_info ?? "",
    },
    notificaciones: {
      content_ready: notificationPreferences.content_ready ?? true,
      weekly_summary: notificationPreferences.weekly_summary ?? true,
      billing: notificationPreferences.billing ?? true,
    },
  };

  return (
    <div>
      <PageHeader title="Configuración" description="Modifica la información de tu negocio en cualquier momento." />
      <SettingsTabs initial={initial} defaultTab={tab} />
    </div>
  );
}
