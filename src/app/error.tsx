"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Root route error", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--background)] px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50">
        <AlertTriangle className="h-6 w-6 text-red-500" strokeWidth={1.5} />
      </span>
      <h1 className="text-lg font-semibold text-zinc-900">Algo salió mal</h1>
      <p className="max-w-sm text-sm text-zinc-500">
        Ocurrió un error inesperado. Intenta de nuevo en un momento.
      </p>
      <div className="mt-2 flex gap-2">
        <Button variant="secondary" onClick={() => reset()}>
          Reintentar
        </Button>
        <Link href="/">
          <Button>Volver al inicio</Button>
        </Link>
      </div>
    </div>
  );
}
