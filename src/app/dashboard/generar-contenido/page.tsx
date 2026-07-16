import { PageHeader } from "@/components/dashboard/page-header";
import { GenerateContentPanel } from "@/components/content/generate-content-panel";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { createClient } from "@/lib/supabase/server";

export default async function GenerarContenidoPage() {
  const { business } = await getCurrentBusiness();
  const supabase = await createClient();

  const { data: calendarItems } = await supabase
    .from("content_calendar")
    .select("*")
    .eq("business_id", business.id)
    .order("scheduled_date", { ascending: true });

  return (
    <div>
      <PageHeader
        title="Generar contenido"
        description="Tus agentes de estrategia y guionista proponen el contenido de los próximos días."
      />
      <GenerateContentPanel businessId={business.id} initialItems={calendarItems ?? []} />
    </div>
  );
}
