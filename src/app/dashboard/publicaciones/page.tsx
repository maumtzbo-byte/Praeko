import { PageHeader } from "@/components/dashboard/page-header";
import { PublicationsList } from "@/components/content/publications-list";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { createClient } from "@/lib/supabase/server";

// publishContentNow (called from this page) polls Meta's Instagram container
// status inline before it can return — see waitForInstagramContainerReady in
// src/lib/social/meta.ts — which alone can take tens of seconds for real
// video. Without this, Vercel's default serverless function duration (10s
// on Hobby, 15s on Pro) would kill the action mid-poll on any video that
// isn't near-instant to process. 60s is the max Hobby allows and covers
// Pro's default with room to spare.
export const maxDuration = 60;

export default async function PublicacionesPage() {
  const { business } = await getCurrentBusiness();
  const supabase = await createClient();

  const [{ data: calendarItems }, { data: inFlightGenerations }, { data: connections }] = await Promise.all([
    supabase
      .from("content_calendar")
      .select("*")
      .eq("business_id", business.id)
      .order("scheduled_date", { ascending: true }),
    // Only queued/processing jobs matter here — completed/failed ones
    // already show up as the content_calendar row's own status.
    supabase
      .from("generations")
      .select("id, content_calendar_id")
      .eq("business_id", business.id)
      .in("job_status", ["queued", "processing"]),
    supabase
      .from("social_connections")
      .select("id, platform, external_account_name")
      .eq("business_id", business.id)
      .eq("status", "active"),
  ]);

  const inFlightByItemId = new Map(
    (inFlightGenerations ?? [])
      .filter((g): g is typeof g & { content_calendar_id: string } => g.content_calendar_id !== null)
      .map((g) => [g.content_calendar_id, g.id]),
  );

  return (
    <div>
      <PageHeader title="Publicaciones programadas" description="Qué está a punto de publicarse y cuándo." />
      <PublicationsList
        initialItems={calendarItems ?? []}
        inFlightByItemId={inFlightByItemId}
        connections={connections ?? []}
      />
    </div>
  );
}
