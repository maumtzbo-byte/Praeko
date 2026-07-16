import { Send } from "lucide-react";
import { ComingSoonPage } from "@/components/dashboard/coming-soon-page";

export default function PublicacionesPage() {
  return (
    <ComingSoonPage
      icon={Send}
      title="Publicaciones programadas"
      description="Qué está a punto de publicarse y cuándo."
      emptyTitle="No hay publicaciones programadas"
      emptyDescription="En cuanto conectes una red social y tengas contenido aprobado, vas a ver aquí cada pieza con su horario de publicación."
    />
  );
}
