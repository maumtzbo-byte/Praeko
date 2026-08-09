"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DashboardMobileTab {
  key: string;
  label: string;
  content: ReactNode;
}

/**
 * Mobile-only, two tabs (Resumen / Analíticas) — only the active tab's
 * content ever mounts, both live on this same /dashboard page. Desktop
 * is unaffected — it keeps the original unconditional flow, since
 * there's no scroll problem on a wide screen.
 */
export function DashboardMobileTabs({ tabs }: { tabs: DashboardMobileTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key);
  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div className="flex flex-col gap-4 sm:hidden">
      <div className="-mx-4 flex gap-1 overflow-x-auto rounded-xl bg-zinc-100 p-1 px-4 sm:mx-0 sm:px-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              activeTab?.key === tab.key ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {activeTab?.content}
    </div>
  );
}
