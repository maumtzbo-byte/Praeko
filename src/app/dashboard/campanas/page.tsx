import { PageHeader } from "@/components/dashboard/page-header";
import { CampaignsPanel } from "@/components/content/campaigns-panel";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { createClient } from "@/lib/supabase/server";

export default async function CampanasPage() {
  const { business } = await getCurrentBusiness();
  const supabase = await createClient();

  const [{ data: campaigns }, { data: pieces }] = await Promise.all([
    supabase
      .from("campaigns")
      .select("*")
      .eq("business_id", business.id)
      .order("start_date", { ascending: false }),
    supabase
      .from("content_calendar")
      .select("campaign_id")
      .eq("business_id", business.id)
      .not("campaign_id", "is", null),
  ]);

  const pieceCountsByCampaign: Record<string, number> = {};
  for (const piece of pieces ?? []) {
    if (!piece.campaign_id) continue;
    pieceCountsByCampaign[piece.campaign_id] = (pieceCountsByCampaign[piece.campaign_id] ?? 0) + 1;
  }

  return (
    <div>
      <PageHeader
        title="Campañas"
        description="Describe qué quieres lograr y por cuánto tiempo — tus agentes arman el plan completo, día por día."
      />
      <CampaignsPanel businessId={business.id} campaigns={campaigns ?? []} pieceCountsByCampaign={pieceCountsByCampaign} />
    </div>
  );
}
