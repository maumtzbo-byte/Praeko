"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, X, Mail } from "lucide-react";
import {
  clampSelection,
  selectionFromPlan,
  selectionPriceCents,
  selectionSecondsBudget,
  formatUsd,
  SELECTION_BOUNDS,
  type CustomPlanSelection,
} from "@/lib/plans/custom-plan";
import { PLAN_LIMITS, type PlanKey } from "@/lib/plans/limits";
import { customPlanEmailHref } from "@/lib/dashboard/request-plan-email";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Las duraciones que ofrecen los proveedores de video, no una escala libre:
// se cobra por segundo generado y nadie contrata "13 segundos".
const VIDEO_LENGTH_STEPS = [5, 10, 15, 20, 25, 30] as const;

function Stepper({
  label,
  hint,
  value,
  displayValue,
  canDecrease,
  canIncrease,
  onStep,
}: {
  label: string;
  hint: string;
  value: number;
  displayValue?: string;
  canDecrease: boolean;
  canIncrease: boolean;
  onStep: (direction: 1 | -1) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-zinc-500">{hint}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label={`Menos ${label}`}
          disabled={!canDecrease}
          onClick={() => onStep(-1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Minus className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        <span className="w-12 text-center text-sm font-semibold tabular-nums text-white">
          {displayValue ?? value}
        </span>
        <button
          type="button"
          aria-label={`Más ${label}`}
          disabled={!canIncrease}
          onClick={() => onStep(1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

/**
 * Plan a la medida: se parte de uno de los tres presets y se mueven las
 * cantidades, con el precio recalculándose en vivo (ver custom-plan.ts para
 * las tarifas y de dónde salen).
 *
 * Deliberadamente NO escribe en `subscriptions`. Todavía no hay cobro en
 * línea, así que dejar que el cliente guarde sus propios límites sería
 * dejarlo asignarse cupo gratis; lo que produce es una solicitud con la
 * configuración deletreada, y quien la activa llena las columnas custom_*
 * del lado del servidor.
 */
export function PlanConfigurator({ businessName }: { businessName: string }) {
  const [open, setOpen] = useState(false);
  const [basePlan, setBasePlan] = useState<PlanKey>("basico");
  const [selection, setSelection] = useState<CustomPlanSelection>(() => selectionFromPlan(PLAN_LIMITS.basico));

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const update = (patch: Partial<CustomPlanSelection>) =>
    setSelection((current) => clampSelection({ ...current, ...patch }));

  const applyPreset = (key: PlanKey) => {
    setBasePlan(key);
    setSelection(selectionFromPlan(PLAN_LIMITS[key]));
  };

  const priceCents = selectionPriceCents(selection);
  const lengthIndex = VIDEO_LENGTH_STEPS.indexOf(selection.videoMaxSeconds as (typeof VIDEO_LENGTH_STEPS)[number]);
  const safeLengthIndex = lengthIndex === -1 ? 1 : lengthIndex;
  const isEmpty =
    selection.videosPerMonth === 0 && selection.imagesPerMonth === 0 && selection.carouselsPerMonth === 0;

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="text-sm font-medium text-accent underline underline-offset-4 transition-opacity hover:opacity-80"
    >
      Solicitar plan personalizado
    </button>
  );

  if (typeof document === "undefined") return trigger;

  return (
    <>
      {trigger}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              className="fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onMouseDown={(e) => {
                if (e.target === e.currentTarget) setOpen(false);
              }}
            >
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-labelledby="plan-configurator-title"
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
                className="relative my-auto w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950 p-6 text-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] sm:p-7"
              >
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Cerrar"
                  className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>

                <h2 id="plan-configurator-title" className="text-lg font-semibold">
                  Arma tu plan
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Empieza de un plan y ajusta solo lo que vas a usar.
                </p>

                <div className="mt-5 flex gap-2">
                  {(Object.keys(PLAN_LIMITS) as PlanKey[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => applyPreset(key)}
                      className={cn(
                        "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-colors",
                        basePlan === key
                          ? "border-accent bg-accent/15 text-white"
                          : "border-white/15 text-zinc-400 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      {PLAN_LIMITS[key].displayName}
                    </button>
                  ))}
                </div>

                <div className="mt-3 divide-y divide-white/10">
                  <Stepper
                    label="Videos al mes"
                    hint={`${selectionSecondsBudget(selection)}s de video en total`}
                    value={selection.videosPerMonth}
                    canDecrease={selection.videosPerMonth > SELECTION_BOUNDS.videosPerMonth.min}
                    canIncrease={selection.videosPerMonth < SELECTION_BOUNDS.videosPerMonth.max}
                    onStep={(d) => update({ videosPerMonth: selection.videosPerMonth + d })}
                  />
                  <Stepper
                    label="Duración de cada video"
                    hint="Máximo por pieza"
                    value={selection.videoMaxSeconds}
                    displayValue={`${selection.videoMaxSeconds}s`}
                    canDecrease={safeLengthIndex > 0}
                    canIncrease={safeLengthIndex < VIDEO_LENGTH_STEPS.length - 1}
                    onStep={(d) =>
                      update({ videoMaxSeconds: VIDEO_LENGTH_STEPS[safeLengthIndex + d] ?? selection.videoMaxSeconds })
                    }
                  />
                  <Stepper
                    label="Imágenes al mes"
                    hint="Publicaciones de una sola imagen"
                    value={selection.imagesPerMonth}
                    canDecrease={selection.imagesPerMonth > SELECTION_BOUNDS.imagesPerMonth.min}
                    canIncrease={selection.imagesPerMonth < SELECTION_BOUNDS.imagesPerMonth.max}
                    onStep={(d) => update({ imagesPerMonth: selection.imagesPerMonth + d })}
                  />
                  <Stepper
                    label="Carruseles al mes"
                    hint="Varias imágenes en una publicación"
                    value={selection.carouselsPerMonth}
                    canDecrease={selection.carouselsPerMonth > SELECTION_BOUNDS.carouselsPerMonth.min}
                    canIncrease={selection.carouselsPerMonth < SELECTION_BOUNDS.carouselsPerMonth.max}
                    onStep={(d) => update({ carouselsPerMonth: selection.carouselsPerMonth + d })}
                  />
                </div>

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex items-baseline justify-center gap-1.5">
                    <span className="text-3xl font-semibold tracking-tight">{formatUsd(priceCents)}</span>
                    <span className="text-sm text-zinc-400">USD/mes</span>
                  </div>
                  <p className="mt-1 text-center text-xs text-zinc-500">
                    Incluye{" "}
                    {PLAN_LIMITS[basePlan].socialNetworkLimit === 1
                      ? "1 red social"
                      : `${PLAN_LIMITS[basePlan].socialNetworkLimit} redes sociales`}{" "}
                    y las funciones del plan {PLAN_LIMITS[basePlan].displayName}.
                  </p>
                </div>

                {isEmpty ? (
                  <p className="mt-4 text-center text-sm text-amber-400">
                    Elige al menos una pieza de contenido al mes.
                  </p>
                ) : (
                  <a href={customPlanEmailHref(businessName, selection, priceCents)} className="mt-5 block">
                    <Button className="w-full bg-accent text-white hover:bg-accent-strong">
                      <Mail className="h-4 w-4" />
                      Solicitar este plan
                    </Button>
                  </a>
                )}

                <p className="mt-3 text-center text-[11px] leading-relaxed text-zinc-600">
                  Sin cargo todavía — te contactamos para confirmar y activarlo.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
