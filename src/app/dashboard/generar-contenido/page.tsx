import { Sparkles } from "lucide-react";
import { ComingSoonPage } from "@/components/dashboard/coming-soon-page";

export default function GenerarContenidoPage() {
  return (
    <ComingSoonPage
      icon={Sparkles}
      title="Generar contenido"
      description="Crea imágenes y videos con tus agentes de IA."
      emptyTitle="Todavía no hay generación activa"
      emptyDescription="En cuanto conectemos los proveedores de generación (Claude, Kling, Seedance), aquí vas a poder pedirle a Praeko una pieza nueva en segundos."
    />
  );
}
