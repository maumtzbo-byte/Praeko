"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, Eye, Heart, MessageCircle, Share2, Clapperboard, ImageIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getContentDetail, type ContentDetail } from "@/app/dashboard/publicaciones/actions";
import { FORMAT_LABELS, STATUS_VARIANTS, STATUS_LABELS, formatScheduledDate } from "@/lib/content/labels";
import { formatInsightNumber } from "@/lib/content/format-insights";

/** Click-into-a-piece detail view — opened from PublicationsList (and, as a
 * mechanical follow-up, could be reused from CalendarView later). Same
 * modal system as PlanRequestModal/FeedbackModal (portal, backdrop, spring
 * entrance) rather than a fourth ad-hoc pattern. `itemId === null` is the
 * closed state — the parent owns which piece (if any) is selected. */
export function ContentDetailModal({ itemId, onClose }: { itemId: string | null; onClose: () => void }) {
  const [detail, setDetail] = useState<ContentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Which itemId `detail`/`error` currently reflect — compared against the
  // current `itemId` prop to derive `loading` below, instead of a separate
  // loading flag set synchronously inside the effect (React Compiler flags
  // that as a footgun: setState belongs in the async callback, not the
  // effect body itself).
  const [loadedForId, setLoadedForId] = useState<string | null>(null);

  useEffect(() => {
    if (!itemId) return;
    let cancelled = false;
    getContentDetail(itemId).then((res) => {
      if (cancelled) return;
      if (!res.success) {
        setError(res.error);
        setDetail(null);
      } else {
        setDetail(res.data);
        setError(null);
      }
      setLoadedForId(itemId);
    });
    return () => {
      cancelled = true;
    };
  }, [itemId]);

  const loading = itemId !== null && loadedForId !== itemId;

  useEffect(() => {
    if (!itemId) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [itemId]);

  useEffect(() => {
    if (!itemId) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [itemId, onClose]);

  if (typeof document === "undefined") return null;

  const open = itemId !== null;
  const MediaIcon = detail?.contentKind === "video" ? Clapperboard : ImageIcon;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
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
            aria-labelledby="content-detail-title"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.4)]"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-zinc-500 shadow-[0_1px_2px_rgba(0,0,0,0.1)] transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="overflow-y-auto">
              {loading && (
                <div className="flex h-64 items-center justify-center">
                  <span className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-500" />
                </div>
              )}

              {!loading && error && (
                <div className="flex h-64 flex-col items-center justify-center gap-2 px-6 text-center">
                  <p className="text-sm text-zinc-500">{error}</p>
                </div>
              )}

              {!loading && detail && (
                <>
                  <div className="flex aspect-video w-full items-center justify-center bg-zinc-950">
                    {detail.mediaUrl ? (
                      detail.contentKind === "video" ? (
                        <video src={detail.mediaUrl} controls className="h-full w-full object-contain" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element -- external fal.ai CDN URL, not a local/Next-optimizable asset
                        <img src={detail.mediaUrl} alt={detail.topic} className="h-full w-full object-contain" />
                      )
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-zinc-500">
                        <MediaIcon className="h-8 w-8" strokeWidth={1.5} />
                        <p className="text-xs">Todavía no se generó contenido para esta pieza.</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 id="content-detail-title" className="text-base font-semibold text-zinc-900">
                          {detail.topic}
                        </h2>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {formatScheduledDate(detail.scheduledDate)} · {FORMAT_LABELS[detail.format]}
                        </p>
                      </div>
                      <Badge variant={STATUS_VARIANTS[detail.status]} className="shrink-0">
                        {STATUS_LABELS[detail.status]}
                      </Badge>
                    </div>

                    {detail.script && <p className="text-sm text-zinc-600">{detail.script}</p>}

                    <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4">
                      <p className="mb-3 text-xs font-semibold tracking-wide text-zinc-500">ESTADÍSTICAS</p>
                      {detail.status !== "publicada" ? (
                        <p className="text-sm text-zinc-500">
                          Vas a poder ver sus estadísticas aquí en cuanto se publique.
                        </p>
                      ) : detail.insights ? (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                          <div>
                            <div className="flex items-center gap-1.5 text-zinc-400">
                              <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
                              <span className="text-[10px] font-medium">IMPRESIONES</span>
                            </div>
                            <p className="mt-1 text-lg font-semibold text-zinc-900">
                              {formatInsightNumber(detail.insights.impressions)}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 text-zinc-400">
                              <Heart className="h-3.5 w-3.5" strokeWidth={1.75} />
                              <span className="text-[10px] font-medium">ME GUSTA</span>
                            </div>
                            <p className="mt-1 text-lg font-semibold text-zinc-900">
                              {formatInsightNumber(detail.insights.likes)}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 text-zinc-400">
                              <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
                              <span className="text-[10px] font-medium">COMENTARIOS</span>
                            </div>
                            <p className="mt-1 text-lg font-semibold text-zinc-900">
                              {formatInsightNumber(detail.insights.comments)}
                            </p>
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 text-zinc-400">
                              <Share2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                              <span className="text-[10px] font-medium">COMPARTIDOS</span>
                            </div>
                            <p className="mt-1 text-lg font-semibold text-zinc-900">
                              {formatInsightNumber(detail.insights.shares)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-zinc-500">Sin datos por ahora.</p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
