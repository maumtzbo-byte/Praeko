import { CreditCard } from "lucide-react";
import { ComingSoonPage } from "@/components/dashboard/coming-soon-page";

export default function FacturacionPage() {
  return (
    <ComingSoonPage
      icon={CreditCard}
      title="Facturación"
      description="Tu método de pago, historial de cargos y facturas."
      emptyTitle="Todavía no tienes una suscripción activa"
      emptyDescription="Elige un plan en Mi plan para activar tu suscripción vía Stripe — desde aquí vas a poder actualizar tu tarjeta y descargar tus recibos."
    />
  );
}
