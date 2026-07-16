import { BarChart3 } from "lucide-react";
import { ComingSoonPage } from "@/components/dashboard/coming-soon-page";

export default function AnaliticasPage() {
  return (
    <ComingSoonPage
      icon={BarChart3}
      title="Analíticas"
      description="Alcance, seguidores y engagement, traducidos a lenguaje de negocio."
      emptyTitle="Todavía no hay datos que mostrar"
      emptyDescription="Cuando conectes tus redes y acumules al menos una semana de resultados, aquí vas a ver tu crecimiento y tu mejor publicación del mes."
    />
  );
}
