"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { generateContentPlan } from "@/app/dashboard/generar-contenido/actions";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";

/** Generation costs real money (Claude API), so this asks for confirmation before spending. */
export function GenerateAction({ businessId, onGenerated }: { businessId: string; onGenerated: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function handleConfirm() {
    setGenerating(true);
    try {
      const res = await generateContentPlan(businessId);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `Se generaron ${res.data.created} piezas de contenido. Te quedan ${res.data.runsRemainingToday} generaciones hoy.`,
      );
      setConfirming(false);
      onGenerated();
    } finally {
      setGenerating(false);
    }
  }

  if (confirming) {
    return (
      <Alert variant="info" className="flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>Esto va a usar tu API key de Claude (cuesta unos centavos de dólar). ¿Generar de todas formas?</span>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" size="sm" onClick={() => setConfirming(false)} disabled={generating}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleConfirm} loading={generating}>
            Confirmar generación
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <Button size="sm" onClick={() => setConfirming(true)}>
      <Sparkles className="h-4 w-4" />
      Generar plan de 7 días
    </Button>
  );
}
