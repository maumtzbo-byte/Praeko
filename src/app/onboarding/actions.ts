"use server";

import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import {
  businessInfoSchema,
  brandInfoSchema,
  socialLinksSchema,
  goalsSchema,
  competitionSchema,
  productsSchema,
  aiInfoSchema,
  type BusinessInfoInput,
  type BrandInfoInput,
  type SocialLinksInput,
  type GoalsInput,
  type CompetitionInput,
  type ProductsInput,
  type AiInfoInput,
} from "@/lib/validation/onboarding";

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");
  return { supabase, user };
}

/** Step 1 — creates the business (tenant) if it doesn't exist yet, or updates it on resume. */
export async function saveBusinessInfo(
  businessId: string | null,
  input: BusinessInfoInput,
): Promise<ActionResult<{ businessId: string }>> {
  const parsed = businessInfoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const v = parsed.data;

  try {
    const { supabase } = await requireUser();

    const businessRow = {
      name: v.name,
      description: v.description,
      industry: v.industry,
      country: v.country,
      city: v.city,
      primary_language: v.primaryLanguage,
      website_url: v.websiteUrl || null,
      phone: v.phone,
      contact_email: v.contactEmail,
    };

    if (businessId) {
      const { error } = await supabase
        .from("businesses")
        .update(businessRow)
        .eq("id", businessId);
      if (error) return { success: false, error: error.message };
      await advanceOnboardingStep(supabase, businessId, 2);
      return { success: true, data: { businessId } };
    }

    // Creates the business and its owner membership atomically on the DB
    // side (see 0006_create_business_rpc.sql) — a plain client-side
    // insert().select() would fail RLS because the RETURNING row is
    // checked against businesses_select, which requires membership that
    // doesn't exist yet at that point.
    const { data: created, error: createError } = await supabase.rpc(
      "create_business_for_current_user",
      {
        p_name: businessRow.name,
        p_description: businessRow.description,
        p_industry: businessRow.industry,
        p_country: businessRow.country,
        p_city: businessRow.city,
        p_primary_language: businessRow.primary_language,
        // Supabase's generated Args type doesn't reflect that this text
        // param accepts null at runtime (the RPC's businesses.website_url
        // column is nullable) — cast to match the overly strict codegen type.
        p_website_url: businessRow.website_url as string,
        p_phone: businessRow.phone,
        p_contact_email: businessRow.contact_email,
      },
    );
    if (createError || !created) {
      return { success: false, error: createError?.message ?? "No se pudo crear el negocio." };
    }

    return { success: true, data: { businessId: created.id } };
  } catch (err) {
    console.error("saveBusinessInfo failed", err);
    return { success: false, error: "No se pudo guardar. Intenta de nuevo." };
  }
}

async function upsertBrandProfile(businessId: string, patch: Record<string, unknown>) {
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("brand_profiles")
    .upsert({ business_id: businessId, ...patch }, { onConflict: "business_id" });
  return error;
}

// Only moves onboarding_step forward — editing a step from Configuración
// after onboarding is already complete must never rewind the wizard's
// resume point.
async function advanceOnboardingStep(
  supabase: Awaited<ReturnType<typeof createClient>>,
  businessId: string,
  nextStep: number,
) {
  await supabase
    .from("businesses")
    .update({ onboarding_step: nextStep })
    .eq("id", businessId)
    .lt("onboarding_step", nextStep);
}

async function bumpOnboardingStep(businessId: string, nextStep: number) {
  const { supabase } = await requireUser();
  await advanceOnboardingStep(supabase, businessId, nextStep);
}

export async function saveBrandInfo(
  businessId: string,
  input: BrandInfoInput,
): Promise<ActionResult> {
  const parsed = brandInfoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const v = parsed.data;
  const error = await upsertBrandProfile(businessId, {
    color_palette: v.colorPalette,
    preferred_fonts: v.preferredFonts,
    brand_tone: v.brandTone,
    brand_values: v.brandValues,
    mission: v.mission,
    target_audience: v.targetAudience,
  });
  if (error) return { success: false, error: error.message };
  await bumpOnboardingStep(businessId, 3);
  return { success: true, data: undefined };
}

export async function saveSocialLinks(
  businessId: string,
  input: SocialLinksInput,
): Promise<ActionResult> {
  const parsed = socialLinksSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const v = parsed.data;
  const error = await upsertBrandProfile(businessId, {
    social_links: {
      instagram: v.instagram,
      facebook: v.facebook,
      tiktok: v.tiktok,
      linkedin: v.linkedin,
      x: v.x,
      youtube: v.youtube,
    },
    other_social_links: v.other,
  });
  if (error) return { success: false, error: error.message };
  await bumpOnboardingStep(businessId, 4);
  return { success: true, data: undefined };
}

export async function saveGoals(
  businessId: string,
  input: GoalsInput,
): Promise<ActionResult> {
  const parsed = goalsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const v = parsed.data;
  const error = await upsertBrandProfile(businessId, {
    goals: v.goals,
    goals_other: v.goalsOther,
  });
  if (error) return { success: false, error: error.message };
  await bumpOnboardingStep(businessId, 5);
  return { success: true, data: undefined };
}

export async function saveCompetition(
  businessId: string,
  input: CompetitionInput,
): Promise<ActionResult> {
  const parsed = competitionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const v = parsed.data;
  const error = await upsertBrandProfile(businessId, {
    main_competitors: v.mainCompetitors,
    admired_companies: v.admiredCompanies,
    style_references: v.styleReferences,
  });
  if (error) return { success: false, error: error.message };
  await bumpOnboardingStep(businessId, 6);
  return { success: true, data: undefined };
}

export async function saveProducts(
  businessId: string,
  input: ProductsInput,
): Promise<ActionResult> {
  const parsed = productsSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const v = parsed.data;
  const error = await upsertBrandProfile(businessId, {
    sells_description: v.sellsDescription,
    product_categories: v.productCategories,
    main_products: v.mainProducts,
    average_ticket: v.averageTicket,
    frequent_promotions: v.frequentPromotions,
  });
  if (error) return { success: false, error: error.message };
  await bumpOnboardingStep(businessId, 7);
  return { success: true, data: undefined };
}

const BETA_TRIAL_DAYS = 30;

/** Beta launch offer: every business that finishes onboarding gets a free
 * month of the cheapest plan automatically, no card, no email round-trip
 * with a human (see the "Solicitar este plan" flow in /dashboard/plan for
 * the manual path Pro/Max still use). subscriptions has no insert/update
 * RLS policy for regular users (billing state is service-role-only by
 * design — see 0001_init.sql), so this needs the service-role client even
 * though the caller's own ownership was already established by whoever
 * called completeOnboarding. Guarded on "no subscription yet" so this only
 * ever fires once per business — the unique index on business_id would
 * reject a second row anyway, but checking first avoids logging a spurious
 * conflict error on a business that already has a real plan. Never blocks
 * onboarding completion if the grant itself fails — a missing free trial
 * is a support conversation, not a reason to strand someone on the wizard. */
async function grantBetaTrial(businessId: string): Promise<void> {
  try {
    const serviceRole = createServiceRoleClient();
    const { data: existing } = await serviceRole
      .from("subscriptions")
      .select("id")
      .eq("business_id", businessId)
      .maybeSingle();
    if (existing) return;

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + BETA_TRIAL_DAYS);

    const { error } = await serviceRole.from("subscriptions").insert({
      business_id: businessId,
      plan_key: "basico",
      status: "active",
      current_period_end: trialEnd.toISOString(),
      is_beta_trial: true,
    });
    if (error) console.error("grantBetaTrial insert failed", error);
  } catch (err) {
    console.error("grantBetaTrial failed", err);
  }
}

/** Marks onboarding done — called once the 3-step compact flow finishes.
 * saveAiInfoAndComplete below also sets this same flag when the (now
 * optional, Configuración-only) AI info step is saved later; setting it
 * twice is harmless. */
export async function completeOnboarding(businessId: string): Promise<ActionResult> {
  try {
    const { supabase } = await requireUser();
    const { error } = await supabase
      .from("businesses")
      .update({ onboarding_step: 4, onboarding_completed_at: new Date().toISOString() })
      .eq("id", businessId);
    if (error) return { success: false, error: error.message };
    await grantBetaTrial(businessId);
    return { success: true, data: undefined };
  } catch (err) {
    console.error("completeOnboarding failed", err);
    return { success: false, error: "No se pudo completar el registro. Intenta de nuevo." };
  }
}

export async function saveAiInfoAndComplete(
  businessId: string,
  input: AiInfoInput,
): Promise<ActionResult> {
  const parsed = aiInfoSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const v = parsed.data;
  const error = await upsertBrandProfile(businessId, {
    personality: v.personality,
    ai_forbidden_topics: v.aiForbiddenTopics,
    ai_forbidden_words: v.aiForbiddenWords,
    ai_response_style: v.aiResponseStyle,
    faqs: v.faqs,
    business_hours: v.businessHours ? { general: v.businessHours } : {},
    address: v.address,
    additional_info: v.additionalInfo,
  });
  if (error) return { success: false, error: error.message };

  const { supabase } = await requireUser();
  await supabase
    .from("businesses")
    .update({ onboarding_step: 8, onboarding_completed_at: new Date().toISOString() })
    .eq("id", businessId);

  return { success: true, data: undefined };
}
