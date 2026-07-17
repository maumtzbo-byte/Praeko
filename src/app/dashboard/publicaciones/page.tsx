import { PageHeader } from "@/components/dashboard/page-header";
import { PublicationsList } from "@/components/content/publications-list";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { createClient } from "@/lib/supabase/server";

export default async function PublicacionesPage() {
  const { business } = await getCurrentBusiness();
  const supabase = await createClient();

  const { data: calendarItems } = await supabase
    .from("content_calendar")
    .select("*")
    .eq("business_id", business.id)
    .order("scheduled_date", { ascending: true });

  return (
    <div>
      <PageHeader title="Publicaciones programadas" description="Qué está a punto de publicarse y cuándo." />
      <PublicationsList initialItems={calendarItems ?? []} />
    </div>
  );
}
