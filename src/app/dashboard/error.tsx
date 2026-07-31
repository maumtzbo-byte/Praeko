"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Dashboard route error", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
        <AlertTriangle className="h-6 w-6 text-red-500" strokeWidth={1.5} />
      </span>
      <h1 className="text-lg font-semibold text-zinc-900">Algo salió mal</h1>
      <p className="max-w-sm text-sm text-zinc-500">
        No pudimos cargar esta página. Intenta de nuevo — si el problema sigue, contáctanos desde Ayuda.
      </p>
      <Button onClick={() => reset()} className="mt-2">
        Reintentar
      </Button>
    </div>
  );
}
