"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type UpgradeReason = "images" | "videos" | "redes";

const REASON_COPY: Record<UpgradeReason, { title: string; description: string }> = {
  images: {
    title: "Ya usaste tus imágenes de este mes",
    description: "Mejora tu plan para seguir generando contenido con IA sin esperar al próximo mes.",
  },
  videos: {
    title: "Ya usaste tus videos de este mes",
    description: "Mejora tu plan para seguir generando videos con IA sin esperar al próximo mes.",
  },
  redes: {
    title: "Ya conectaste el máximo de redes de tu plan",
    description: "Mejora tu plan para conectar más cuentas y publicar en todas tus redes a la vez.",
  },
};

/**
 * The one place a plan limit is allowed to interrupt someone: a dismissible
 * overlay with a real path forward (Ver planes), not a bare "no" toast or a
 * hard redirect to another page — a click that goes nowhere reads as
 * broken, and a page that yanks you away mid-task reads as hostile. Escape
 * and backdrop click both close it with zero cost to whatever the person
 * was doing underneath.
 */
export function UpgradePlanModal({ reason, onClose }: { reason: UpgradeReason; onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const copy = REASON_COPY[reason];

  return (
    <div
      className="animate-modal-backdrop-in fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-plan-title"
        className="animate-modal-in relative w-full max-w-sm rounded-3xl border border-[var(--hairline)] bg-white p-6 shadow-2xl "
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 "
        >
          <X className="h-4 w-4" />
        </button>

        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Sparkles className="h-5 w-5" />
        </span>

        <h3 id="upgrade-plan-title" className="mt-4 text-lg font-semibold text-zinc-900">
          {copy.title}
        </h3>
        <p className="mt-1.5 text-sm text-zinc-500">{copy.description}</p>

        <div className="mt-6 flex flex-col gap-2">
          <Link href="/dashboard/plan">
            <Button className="w-full">Ver planes</Button>
          </Link>
          <Button variant="secondary" className="w-full" onClick={onClose}>
            Ahora no
          </Button>
        </div>
      </div>
    </div>
  );
}
