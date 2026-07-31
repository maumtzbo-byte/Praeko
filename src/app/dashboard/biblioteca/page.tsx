import { FolderOpen } from "lucide-react";
import { ComingSoonPage } from "@/components/dashboard/coming-soon-page";

export default function BibliotecaPage() {
  return (
    <ComingSoonPage
      icon={FolderOpen}
      title="Biblioteca multimedia"
      description="Todas tus piezas generadas, en un solo lugar."
      emptyTitle="Todavía no hay contenido generado"
      emptyDescription="Cada imagen y video que Frames genere para tu marca va a quedar guardado aquí, listo para descargar o reutilizar."
    />
  );
}
