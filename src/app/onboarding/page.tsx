import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard, type OnboardingWizardInitialData } from "@/components/onboarding/onboarding-wizard";

export const metadata: Metadata = { title: "Onboarding — Praeko" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("business_members")
    .select("business_id")
    .eq("user_id", user!.id)
    .limit(1)
    .maybeSingle();

  let business = null;
  let brandProfile = null;
  let logoUrl: string | null = null;

  if (membership) {
    const { data: businessRow } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", membership.business_id)
      .single();
    business = businessRow;

    if (business?.onboarding_completed_at) {
      redirect("/dashboard");
    }

    const { data: brandProfileRow } = await supabase
      .from("brand_profiles")
      .select("*")
      .eq("business_id", membership.business_id)
      .maybeSingle();
    brandProfile = brandProfileRow;

    const { data: logoAsset } = await supabase
      .from("brand_assets")
      .select("storage_path")
      .eq("business_id", membership.business_id)
      .eq("asset_type", "logo")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (logoAsset) {
      const { data: signed } = await supabase.storage
        .from("brand-assets")
        .createSignedUrl(logoAsset.storage_path, 3600);
      logoUrl = signed?.signedUrl ?? null;
    }
  }

  const socialLinks = (brandProfile?.social_links ?? {}) as Record<string, string>;
  const otherSocialLinks = (brandProfile?.other_social_links ?? []) as {
    label: string;
    url: string;
  }[];
  const faqs = (brandProfile?.faqs ?? []) as { question: string; answer: string }[];
  const businessHours = (brandProfile?.business_hours ?? {}) as { general?: string };

  const initial: OnboardingWizardInitialData = {
    businessId: business?.id ?? null,
    step: business?.onboarding_step ?? 1,
    logoUrl,
    negocio: {
      name: business?.name ?? "",
      description: business?.description ?? "",
      industry: business?.industry ?? "",
      country: business?.country ?? "",
      city: business?.city ?? "",
      primaryLanguage: business?.primary_language ?? "",
      websiteUrl: business?.website_url ?? "",
      phone: business?.phone ?? "",
      contactEmail: business?.contact_email ?? user!.email ?? "",
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
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-[var(--background)] px-4 py-16 sm:px-6">
      <OnboardingWizard initial={initial} />
    </div>
  );
}
