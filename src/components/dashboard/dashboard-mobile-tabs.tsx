"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardMobileTabsProps {
  resumenLabel: string;
  resumen: ReactNode;
  analiticasLabel: string;
  analiticas: ReactNode;
}

/**
 * Mobile-only. The dashboard home has to hold both a quick daily glance
 * (recent activity) and a deeper analytics view (growth chart, top
 * videos, insights) in the same page — the user wants both reachable
 * without leaving the Dashboard, but doesn't want to scroll through all
 * of it just to check what happened today. Splitting it into two tabs
 * (only the active one ever mounts) keeps the default view short and
 * still puts the analytics one tap away. Desktop is unaffected — it
 * keeps showing everything in one flow, since there's no scroll problem
 * on a wide screen.
 */
export function DashboardMobileTabs({ resumenLabel, resumen, analiticasLabel, analiticas }: DashboardMobileTabsProps) {
  const [active, setActive] = useState<"resumen" | "analiticas">("resumen");

  return (
    <div className="flex flex-col gap-4 sm:hidden">
      <div className="flex gap-1 rounded-xl bg-zinc-100 p-1">
        {(
          [
            ["resumen", resumenLabel],
            ["analiticas", analiticasLabel],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActive(key)}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active === key ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {active === "resumen" ? resumen : analiticas}
    </div>
  );
}
