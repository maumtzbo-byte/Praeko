"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Star, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { submitFeedback } from "@/app/dashboard/feedback-actions";
import { cn } from "@/lib/utils";

// If the dueño dismisses without submitting, don't show it again on every
// reload for the rest of the day — the server-side "no submission this
// calendar month" check (shouldPromptFeedback in dashboard/layout.tsx)
// still fires on the next fresh page load, this just spaces out the nag.
const DISMISS_STORAGE_KEY = "frames_feedback_dismissed_at";
const DISMISS_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000;
// Small delay so it never fires the instant the dashboard paints — reading
// a monthly survey mid-load feels like an interruption, right after feels
// like a question.
const OPEN_DELAY_MS = 1500;

function wasRecentlyDismissed(): boolean {
  try {
    const raw = window.localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!raw) return false;
    return Date.now() - Number(raw) < DISMISS_COOLDOWN_MS;
  } catch {
    return false;
  }
}

function markDismissed() {
  try {
    window.localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
  } catch {
    // Private browsing / storage disabled — worst case it asks again sooner.
  }
}

const RATING_LABELS: Record<number, string> = {
  1: "Muy mala",
  2: "Mala",
  3: "Regular",
  4: "Buena",
  5: "Excelente",
};

export function FeedbackModal({ businessId, eligible }: { businessId: string; eligible: boolean }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [recommendation, setRecommendation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!eligible || wasRecentlyDismissed()) return;
    const timer = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [eligible]);

  function close() {
    markDismissed();
    setOpen(false);
  }

  async function handleSubmit() {
    if (rating === 0) return;
    setSubmitting(true);
    const res = await submitFeedback(businessId, rating, recommendation);
    setSubmitting(false);
    if (!res.success) {
      toast.error(res.error);
      return;
    }
    toast.success("¡Gracias por tu opinión!");
    setOpen(false);
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-modal-title"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative w-full max-w-sm rounded-3xl border border-zinc-200 bg-white p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.35)] "
          >
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar"
              className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 id="feedback-modal-title" className="pr-8 text-lg font-semibold text-zinc-900">
              ¿Cómo ha sido tu experiencia con Frames?
            </h2>
            <p className="mt-1 text-sm text-zinc-500">Nos ayuda a mejorar cada mes — toma 10 segundos.</p>

            <div className="mt-5 flex items-center justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((value) => {
                const filled = value <= (hoverRating || rating);
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHoverRating(value)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`${value} de 5 estrellas`}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn("h-8 w-8 transition-colors", filled ? "fill-amber-400 text-amber-400" : "text-zinc-300")}
                      strokeWidth={1.5}
                    />
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 h-4 text-center text-xs font-medium text-zinc-500">
              {RATING_LABELS[hoverRating || rating] ?? ""}
            </p>

            <label className="mt-5 block text-sm font-medium text-zinc-700">
              ¿Alguna recomendación? <span className="font-normal text-zinc-400">(opcional)</span>
              <textarea
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="¿Qué le agregarías o mejorarías a Frames?"
                className="mt-1.5 w-full resize-none rounded-xl border border-zinc-200 px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:border-accent focus:outline-none"
              />
            </label>

            <div className="mt-5 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={close}>
                Ahora no
              </Button>
              <Button className="flex-1" disabled={rating === 0} loading={submitting} onClick={handleSubmit}>
                Enviar
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
