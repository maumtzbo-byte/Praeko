import { Bot } from "lucide-react";
import { ComingSoonPage } from "@/components/dashboard/coming-soon-page";

export default function IaMarketingPage() {
  return (
    <ComingSoonPage
      icon={Bot}
      title="IA de Marketing"
      description="Cómo están razonando tus agentes de estrategia, guion y revisión de calidad."
      emptyTitle="Aún no hay actividad de los agentes"
      emptyDescription="Aquí vas a poder ver y ajustar las decisiones de tus agentes de IA — qué proponen publicar, por qué, y qué piezas marcaron para tu revisión."
    />
  );
}
