import { CalendarDays } from "lucide-react";
import { ComingSoonPage } from "@/components/dashboard/coming-soon-page";

export default function CalendarioPage() {
  return (
    <ComingSoonPage
      icon={CalendarDays}
      title="Calendario"
      description="El calendario de contenido mensual que arma tu agente de estrategia."
      emptyTitle="Aún no hay un calendario generado"
      emptyDescription="Cuando termines de conectar tu plan, Praeko va a proponerte qué publicar cada día del mes — tema, formato y guion incluidos."
    />
  );
}
