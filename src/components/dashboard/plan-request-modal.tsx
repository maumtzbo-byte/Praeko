"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Mail, X } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { requestPlanEmailHref } from "@/lib/dashboard/request-plan-email";

const BRAND_CONFETTI_COLORS = ["#1e6b4c", "#0a2e23", "#ece3d8", "#c9b896"];

// canvas-confetti's own canvas defaults to z-index: 100, which sits behind
// this modal's z-[200] overlay — without an explicit higher value here the
// burst fires completely hidden behind the backdrop.
const CONFETTI_Z_INDEX = 300;

function fireConfetti() {
  confetti({ particleCount: 70, spread: 70, origin: { y: 0.3 }, colors: BRAND_CONFETTI_COLORS, scalar: 0.9, zIndex: CONFETTI_Z_INDEX });
  confetti({ particleCount: 30, angle: 60, spread: 55, origin: { x: 0, y: 0.4 }, colors: BRAND_CONFETTI_COLORS, zIndex: CONFETTI_Z_INDEX });
  confetti({ particleCount: 30, angle: 120, spread: 55, origin: { x: 1, y: 0.4 }, colors: BRAND_CONFETTI_COLORS, zIndex: CONFETTI_Z_INDEX });
}

export default function PlanRequestModal({
  open,
  onClose,
  businessName,
  planDisplayName,
  priceUsd,
}: {
  open: boolean;
  onClose: () => void;
  businessName: string;
  planDisplayName: string;
  priceUsd: number;
}) {
  // Computed fresh each time the modal opens (not once at first mount) —
  // this component stays mounted by its parent the whole time, only its
  // visible content toggles with `open`, so a plain lazy useState initializer
  // would freeze on the very first open forever.
  const [meta, setMeta] = useState<{ date: Date; reference: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- timestamp/reference must be generated at the moment it actually opens, and confetti() itself is a one-shot external side effect that can't run during render.
    setMeta({ date: new Date(), reference: `REQ-${Date.now().toString(36).toUpperCase()}` });
    fireConfetti();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="plan-request-title"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-7 text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.05 }}
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/15"
            >
              <Check className="h-7 w-7 text-accent" strokeWidth={2.5} />
            </motion.div>

            <h2 id="plan-request-title" className="mt-5 text-center text-lg font-semibold">
              ¡Listo! Tu solicitud fue enviada
            </h2>
            <p className="mt-1.5 text-center text-sm text-zinc-400">
              Te contactaremos para activar tu plan {planDisplayName}.
            </p>

            <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-center">
              <div>
                <p className="text-[10px] font-semibold tracking-wide text-zinc-500">PLAN</p>
                <p className="mt-1 text-sm font-medium">{planDisplayName}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-wide text-zinc-500">PRECIO</p>
                <p className="mt-1 text-sm font-medium">${priceUsd.toFixed(0)}/mes</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold tracking-wide text-zinc-500">FECHA</p>
                <p className="mt-1 text-sm font-medium">
                  {meta?.date.toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>

            {/* No fake card/ticket details — there's no real payment yet, so
                this says exactly that instead of fabricating one. */}
            <p className="mt-4 text-center text-xs leading-relaxed text-zinc-500">
              Sin cargo todavía — un miembro de nuestro equipo te escribirá para completar la activación.
            </p>

            <p className="mt-3 text-center text-[11px] tracking-wide text-zinc-600">
              Referencia de tu solicitud: <span className="font-mono text-zinc-400">{meta?.reference}</span>
            </p>

            <div className="mt-6 flex gap-3">
              <Button variant="secondary" className="flex-1 border-white/15 bg-white/5 text-white hover:bg-white/10" onClick={onClose}>
                Cerrar
              </Button>
              <a href={requestPlanEmailHref(businessName, planDisplayName, priceUsd)} className="flex-1">
                <Button className="w-full bg-accent text-white hover:bg-accent-strong">
                  <Mail className="h-4 w-4" />
                  Abrir correo
                </Button>
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
