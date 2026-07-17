import { PageHeader } from "@/components/dashboard/page-header";
import { CalendarView } from "@/components/calendar/calendar-view";
import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { createClient } from "@/lib/supabase/server";

export default async function CalendarioPage() {
  const { business } = await getCurrentBusiness();
  const supabase = await createClient();

  const { data: calendarItems } = await supabase
    .from("content_calendar")
    .select("*")
    .eq("business_id", business.id)
    .order("scheduled_date", { ascending: true });

  return (
    <div>
      <PageHeader title="Calendario" description="Todo tu contenido organizado por fecha." />
      <CalendarView initialItems={calendarItems ?? []} />
    </div>
  );
}
