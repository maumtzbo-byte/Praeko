import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { DashboardShell, type PlanBannerInfo } from "@/components/dashboard/dashboard-shell";
import { createClient } from "@/lib/supabase/server";

// Threshold at which a subscribed business gets nudged to upgrade before
// actually running out mid-month — high enough that it only fires when
// upgrading is genuinely relevant, not on every visit.
const NEAR_LIMIT_THRESHOLD = 0.8;

async function getPlanBanner(businessId: string): Promise<PlanBannerInfo | null> {
  const supabase = await createClient();
  const periodMonth = new Date();
  periodMonth.setDate(1);
  const periodMonthStr = periodMonth.toISOString().slice(0, 10);

  const [{ data: subscription }, { data: usage }] = await Promise.all([
    supabase.from("subscriptions").select("plan_key, status").eq("business_id", businessId).maybeSingle(),
    supabase
      .from("usage_counters")
      .select("videos_used, images_used")
      .eq("business_id", businessId)
      .eq("period_month", periodMonthStr)
      .maybeSingle(),
  ]);

  if (!subscription) return { kind: "no_plan" };
  if (subscription.status === "past_due") return { kind: "past_due" };
  if (subscription.status !== "active") return { kind: "no_plan" };

  const { data: plan } = await supabase
    .from("plans")
    .select("videos_per_month, images_per_month")
    .eq("key", subscription.plan_key)
    .maybeSingle();
  if (!plan) return null;

  const videosPct = plan.videos_per_month > 0 ? (usage?.videos_used ?? 0) / plan.videos_per_month : 0;
  const imagesPct = plan.images_per_month > 0 ? (usage?.images_used ?? 0) / plan.images_per_month : 0;
  const maxPct = Math.max(videosPct, imagesPct);

  if (maxPct >= NEAR_LIMIT_THRESHOLD) {
    return { kind: "near_limit", percent: Math.min(100, Math.round(maxPct * 100)) };
  }
  return null;
}

// Don't ask a business to rate its experience before it's had one — this
// gates the monthly feedback prompt to accounts that finished onboarding
// at least this long ago.
const FEEDBACK_MIN_ACCOUNT_AGE_DAYS = 7;

/** Whether to show the "1-5 estrellas, ¿alguna recomendación?" prompt
 * (see FeedbackModal): once per calendar month per business, and only
 * once the business has had a real chance to use the product. */
async function shouldPromptFeedback(businessId: string, onboardingCompletedAt: string | null): Promise<boolean> {
  if (!onboardingCompletedAt) return false;
  const accountAgeMs = Date.now() - new Date(onboardingCompletedAt).getTime();
  if (accountAgeMs < FEEDBACK_MIN_ACCOUNT_AGE_DAYS * 86_400_000) return false;

  const supabase = await createClient();
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);

  const { data: existing } = await supabase
    .from("feedback_submissions")
    .select("id")
    .eq("business_id", businessId)
    .gte("created_at", startOfMonth.toISOString())
    .limit(1)
    .maybeSingle();

  return !existing;
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { business } = await getCurrentBusiness();
  const [planBanner, showFeedbackPrompt] = await Promise.all([
    getPlanBanner(business.id),
    shouldPromptFeedback(business.id, business.onboarding_completed_at),
  ]);

  return (
    <DashboardShell businessName={business.name} businessId={business.id} planBanner={planBanner} showFeedbackPrompt={showFeedbackPrompt}>
      {children}
    </DashboardShell>
  );
}
