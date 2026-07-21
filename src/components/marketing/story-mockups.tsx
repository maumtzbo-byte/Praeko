"use client";

import { motion, useTransform, useMotionValueEvent, type MotionValue } from "framer-motion";
import { useState } from "react";
import { Check, Image as ImageIcon, Play, Sparkles, Video } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/** Small preview cards mirroring the real dashboard's visual language —
 * these stand in for the beat's own work instead of an abstract shape. */

export function BrandMockup() {
  return (
    <Card className="w-72 p-6 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_24px_48px_-24px_rgba(0,0,0,0.35)] sm:w-80">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-zinc-300 shadow-[0_1px_2px_rgba(0,0,0,0.15)_inset,0_2px_6px_rgba(0,0,0,0.08)] dark:from-zinc-700 dark:to-zinc-800">
          <Sparkles className="h-5 w-5 text-zinc-700 dark:text-zinc-300" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Tu negocio</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Perfil de marca</p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Badge>Cercano</Badge>
        <Badge>Profesional</Badge>
        <Badge>Directo</Badge>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        Tono, público y servicios — aprendidos en minutos.
      </p>
    </Card>
  );
}

const WEEK_DAYS = ["L", "M", "M", "J", "V", "S", "D"];

export function CalendarMockup() {
  return (
    <Card className="w-72 p-6 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_24px_48px_-24px_rgba(0,0,0,0.35)] sm:w-80">
      <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500 dark:text-zinc-400">ESTA SEMANA</p>
      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {WEEK_DAYS.map((day, i) => {
          const active = i === 2;
          return (
            <div
              key={i}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl py-2.5",
                active ? "bg-zinc-900 dark:bg-white" : "bg-zinc-100 dark:bg-zinc-800",
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-medium",
                  active ? "text-white dark:text-zinc-950" : "text-zinc-500 dark:text-zinc-400",
                )}
              >
                {day}
              </span>
              {active ? (
                <Video className="h-3.5 w-3.5 text-white dark:text-zinc-950" strokeWidth={1.75} />
              ) : (
                <ImageIcon className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" strokeWidth={1.75} />
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        Qué se publica, en qué formato, y a qué hora — según tu plan.
      </p>
    </Card>
  );
}

export function VideoMockup({ progress }: { progress: MotionValue<number> }) {
  const width = useTransform(progress, [0, 1], ["8%", "94%"]);
  return (
    <Card className="w-56 overflow-hidden p-0 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_24px_48px_-24px_rgba(0,0,0,0.35)]">
      <div className="relative aspect-[9/16] w-full bg-gradient-to-br from-zinc-800 via-zinc-700 to-zinc-950">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
            <Play className="h-6 w-6 fill-white text-white" />
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Generando video…</p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-zinc-500 via-zinc-800 to-zinc-950 dark:from-zinc-400 dark:via-zinc-200 dark:to-white"
            style={{ width }}
          />
        </div>
      </div>
    </Card>
  );
}

function ChecklistRow({ label, index, progress }: { label: string; index: number; progress: MotionValue<number> }) {
  // The scroll-snap quantizer always rests exactly at a beat's own start
  // (local progress 0) — so these can't animate from "invisible" the way a
  // freely-scrolled reveal could, or every visitor who pauses to read the
  // caption sees three barely-there checkmarks instead of "already
  // reviewed". Starting near-resolved (0.92) keeps a subtle settle-in
  // during the transition glide without the resting frame looking broken.
  const start = index * 0.28;
  const opacity = useTransform(progress, [start, start + 0.18], [0.92, 1]);
  const scale = useTransform(progress, [start, start + 0.18], [0.94, 1]);
  return (
    <motion.div style={{ opacity }} className="flex items-center gap-2.5 text-xs text-zinc-600 dark:text-zinc-400">
      <motion.span
        style={{ scale }}
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
      >
        <Check className="h-2.5 w-2.5" strokeWidth={3} />
      </motion.span>
      {label}
    </motion.div>
  );
}

const REVIEW_ITEMS = ["Tono de marca", "Identidad visual", "Calidad final"];

export function ReviewMockup({ progress }: { progress: MotionValue<number> }) {
  return (
    <Card className="w-72 p-6 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_24px_48px_-24px_rgba(0,0,0,0.35)] sm:w-80">
      <div className="flex items-center gap-3">
        <div className="h-12 w-16 shrink-0 rounded-lg bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800" />
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Publicación #24</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Lista para revisión</p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-2.5">
        {REVIEW_ITEMS.map((label, i) => (
          <ChecklistRow key={label} label={label} index={i} progress={progress} />
        ))}
      </div>
    </Card>
  );
}

export function ChatMockup({ progress }: { progress: MotionValue<number> }) {
  // Same "always rests at local progress 0" reasoning as ChecklistRow — the
  // reply needs to already be mostly visible at rest, or the beat's own
  // "respondemos preguntas de compra" promise shows an unanswered question.
  const replyOpacity = useTransform(progress, [0, 0.3], [0.8, 1]);
  const replyY = useTransform(progress, [0, 0.3], [4, 0]);
  return (
    <Card className="w-72 p-6 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_24px_48px_-24px_rgba(0,0,0,0.35)] sm:w-80">
      <div className="flex flex-col gap-2.5">
        <div className="max-w-[80%] self-start rounded-2xl rounded-bl-sm bg-zinc-100 px-3.5 py-2 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          ¿Tienen envío a domicilio?
        </div>
        <motion.div
          style={{ opacity: replyOpacity, y: replyY }}
          className="max-w-[85%] self-end rounded-2xl rounded-br-sm bg-zinc-900 px-3.5 py-2 text-xs text-white dark:bg-white dark:text-zinc-950"
        >
          ¡Sí! Entregamos en 24–48h. ¿A qué zona te enviamos?
        </motion.div>
      </div>
    </Card>
  );
}

function AnalyticsBar({ progress, target }: { progress: MotionValue<number>; target: number }) {
  // Bars start at 88% of their target height, not 0 — the scroll-snap
  // quantizer rests exactly at this beat's start (progress 0), so a visitor
  // who stops to read "medimos resultados" needs to already see a real
  // ascending chart, not five flat stubs.
  const height = useTransform(progress, [0, 1], [target * 0.88, target]);
  return <motion.div className="flex-1 rounded-t-md bg-zinc-800 dark:bg-zinc-300" style={{ height }} />;
}

const BAR_TARGETS = [40, 64, 50, 78, 96];

export function AnalyticsMockup({ progress }: { progress: MotionValue<number> }) {
  const [display, setDisplay] = useState(228);
  // Same reasoning: ranges from an already-credible +228% at rest up to
  // +248% during the transition, instead of animating from +0%.
  useMotionValueEvent(progress, "change", (v) => setDisplay(Math.round(228 + v * 20)));

  return (
    <Card className="w-72 p-6 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset,0_24px_48px_-24px_rgba(0,0,0,0.35)] sm:w-80">
      <p className="text-xs font-semibold tracking-[0.2em] text-zinc-500 dark:text-zinc-400">ALCANCE MENSUAL</p>
      <p className="aurora-text mt-1 text-3xl font-bold tabular-nums">+{display}%</p>
      <div className="mt-4 flex h-16 items-end gap-1.5">
        {BAR_TARGETS.map((target, i) => (
          <AnalyticsBar key={i} progress={progress} target={target} />
        ))}
      </div>
    </Card>
  );
}
