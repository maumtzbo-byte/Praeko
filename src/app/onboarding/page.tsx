import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { ACTIVE_BUSINESS_COOKIE } from "@/lib/dashboard/get-current-business";
import { OnboardingWizard, type OnboardingWizardInitialData } from "@/components/onboarding/onboarding-wizard";

export const metadata: Metadata = { title: "Onboarding — Frames" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: startNew } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // ?new=1 (from the workspace switcher's "Agregar otro negocio") always
  // starts a fresh business, ignoring any existing membership — a
  // freelancer running several client workspaces needs this to add one
  // without resuming/overwriting whichever business happens to be active.
  // Otherwise, prefer the active_business_id cookie so resuming a plain
  // /onboarding visit continues the business actually in progress (which
  // may not be the user's oldest/first one) instead of an arbitrary row.
  let membershipBusinessId: string | null = null;
  if (startNew !== "1") {
    const cookieStore = await cookies();
    const activeId = cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value;
    if (activeId) {
      const { data: activeMembership } = await supabase
        .from("business_members")
        .select("business_id")
        .eq("user_id", user.id)
        .eq("business_id", activeId)
        .maybeSingle();
      membershipBusinessId = activeMembership?.business_id ?? null;
    }
    if (!membershipBusinessId) {
      const { data: anyMembership } = await supabase
        .from("business_members")
        .select("business_id")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      membershipBusinessId = anyMembership?.business_id ?? null;
    }
  }

  let business = null;
  let brandProfile = null;
  let logoUrl: string | null = null;

  if (membershipBusinessId) {
    const { data: businessRow } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", membershipBusinessId)
      .single();
    business = businessRow;

    if (business?.onboarding_completed_at) {
      redirect("/dashboard");
    }

    const { data: brandProfileRow } = await supabase
      .from("brand_profiles")
      .select("*")
      .eq("business_id", membershipBusinessId)
      .maybeSingle();
    brandProfile = brandProfileRow;

    const { data: logoAsset } = await supabase
      .from("brand_assets")
      .select("storage_path")
      .eq("business_id", membershipBusinessId)
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
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-[var(--background)] px-4 py-16 sm:px-6">
      <OnboardingWizard initial={initial} />
    </div>
  );
}
