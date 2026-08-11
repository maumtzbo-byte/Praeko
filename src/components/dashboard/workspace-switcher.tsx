"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronsUpDown, Check, Plus } from "lucide-react";
import { switchBusiness } from "@/lib/dashboard/business-actions";
import { cn } from "@/lib/utils";
import type { BusinessSummary } from "@/lib/dashboard/get-current-business";

/** Replaces the old static "business name" block once a user can belong to
 * more than one business (e.g. a freelancer running one workspace per
 * client) — lets them see which one is active and switch, plus start a new
 * one, all without leaving the sidebar. */
export function WorkspaceSwitcher({
  businesses,
  activeBusinessId,
  onNavigate,
}: {
  businesses: BusinessSummary[];
  activeBusinessId: string;
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const active = businesses.find((b) => b.id === activeBusinessId) ?? businesses[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-accent/15 bg-accent/[0.06] px-3 py-2.5 text-left transition-colors hover:bg-accent/[0.1]"
      >
        <p className="truncate text-sm font-medium text-zinc-800">{active?.name ?? "Selecciona un negocio"}</p>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-zinc-400" strokeWidth={2} />
      </button>

      {open && (
        <>
          {/* Click-outside catcher, same pattern as the mobile nav drawer's
              overlay in dashboard-shell.tsx. */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
            <div className="max-h-56 overflow-y-auto py-1">
              {businesses.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setOpen(false);
                    if (b.id === activeBusinessId) return;
                    startTransition(() => {
                      switchBusiness(b.id);
                    });
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
                >
                  <Check
                    className={cn("h-3.5 w-3.5 shrink-0", b.id === activeBusinessId ? "text-accent" : "text-transparent")}
                    strokeWidth={2.5}
                  />
                  <span className="truncate">{b.name}</span>
                </button>
              ))}
            </div>
            <Link
              href="/onboarding?new=1"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className="flex items-center gap-2 border-t border-zinc-100 px-3 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/5"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Agregar otro negocio
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
