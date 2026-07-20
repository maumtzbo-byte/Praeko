import Link from "next/link";
import { CreditCard, Gem } from "lucide-react";
import { ComingSoonPage } from "@/components/dashboard/coming-soon-page";
import { Button } from "@/components/ui/button";

export default function FacturacionPage() {
  return (
    <ComingSoonPage
      icon={CreditCard}
      title="Facturación"
      description="Tu método de pago, historial de cargos y facturas."
      emptyTitle="Todavía no tienes una suscripción activa"
      emptyDescription="Elige un plan en Mi plan para activarlo — desde aquí vas a poder actualizar tu tarjeta y descargar tus recibos."
      action={
        <Link href="/dashboard/plan">
          <Button size="sm">
            <Gem className="h-4 w-4" />
            Ver planes
          </Button>
        </Link>
      }
    />
  );
}
