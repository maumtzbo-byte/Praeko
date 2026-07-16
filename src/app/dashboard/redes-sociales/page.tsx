import { Share2 } from "lucide-react";
import { ComingSoonPage } from "@/components/dashboard/coming-soon-page";

export default function RedesSocialesPage() {
  return (
    <ComingSoonPage
      icon={Share2}
      title="Redes sociales"
      description="Conecta Instagram, Facebook y TikTok para publicar automáticamente."
      emptyTitle="Ninguna red conectada todavía"
      emptyDescription="Cuando conectemos Meta Graph API y TikTok for Business, vas a poder autorizar tus cuentas aquí en un par de clics — nunca necesitas darnos tus contraseñas."
    />
  );
}
