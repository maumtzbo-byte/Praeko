"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
import { FramesMark } from "@/components/brand/FramesMark";
import { SidebarNav } from "./sidebar-nav";
import { FeedbackModal } from "./feedback-modal";

export type PlanBannerInfo =
  | { kind: "no_plan" }
  | { kind: "past_due" }
  | { kind: "near_limit"; percent: number };

const BANNER_COPY: Record<
  PlanBannerInfo["kind"],
  { title: string; description: string; cta: string; icon: typeof Sparkles; tone: "accent" | "warning" }
> = {
  no_plan: {
    title: "Activa tu plan para generar contenido",
    description: "Elige un plan y tu primer calendario de contenido puede estar listo hoy mismo.",
    cta: "Ver planes",
    icon: Sparkles,
    tone: "accent",
  },
  near_limit: {
    title: "Estás cerca del límite de tu plan este mes",
    description: "Mejora tu plan para no quedarte sin generaciones antes de que termine el mes.",
    cta: "Mejorar plan",
    icon: TrendingUp,
    tone: "accent",
  },
  past_due: {
    title: "Tu pago no se pudo procesar",
    description: "Actualiza tu método de pago para seguir generando contenido sin interrupciones.",
    cta: "Resolver ahora",
    icon: AlertTriangle,
    tone: "warning",
  },
};

function PlanBanner({ info }: { info: PlanBannerInfo }) {
  const copy = BANNER_COPY[info.kind];
  const Icon = copy.icon;
  const title = info.kind === "near_limit" ? `Ya usaste ${info.percent}% de tu plan este mes` : copy.title;
  const isWarning = copy.tone === "warning";

  return (
    <div
      className={
        isWarning
          ? "mb-6 flex flex-col items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between "
          : "mb-6 flex flex-col items-start gap-3 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
      }
    >
      <div className="flex items-start gap-3">
        <span
          className={
            isWarning
              ? "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white"
              : "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-white"
          }
        >
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <div>
          <p className="text-sm font-semibold text-zinc-900">{title}</p>
          <p className="text-sm text-zinc-600">{copy.description}</p>
        </div>
      </div>
      <Link
        href="/dashboard/plan"
        className="shrink-0 whitespace-nowrap rounded-full bg-zinc-950 px-4 py-2 text-xs font-semibold text-white shadow-[0_1px_0_rgba(255,255,255,0.4)_inset] transition-transform hover:scale-[1.03] "
      >
        {copy.cta}
      </Link>
    </div>
  );
}

export function DashboardShell({
  businessName,
  businessId,
  planBanner = null,
  showFeedbackPrompt = false,
  children,
}: {
  businessName: string;
  businessId: string;
  planBanner?: PlanBannerInfo | null;
  showFeedbackPrompt?: boolean;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <FeedbackModal businessId={businessId} eligible={showFeedbackPrompt} />
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-zinc-200 bg-white/80 backdrop-blur-sm lg:block ">
        <SidebarNav businessName={businessName} needsPlanAttention={planBanner !== null} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
            <button
              className="absolute right-3 top-3 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 "
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarNav
              businessName={businessName}
              needsPlanAttention={planBanner !== null}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-zinc-200 bg-[var(--background)]/80 px-4 py-3 backdrop-blur-sm lg:hidden">
          <button
            className="rounded-lg p-1.5 text-zinc-700 hover:bg-zinc-100 "
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="flex items-center gap-2 text-sm font-semibold tracking-[0.2em] text-zinc-950">
            <FramesMark className="h-4 w-4" />
            FRAMES
          </span>
        </header>

        <main className="px-4 py-8 sm:px-6 lg:px-10">
          {planBanner && <PlanBanner info={planBanner} />}
          {children}
        </main>
      </div>
    </div>
  );
}
