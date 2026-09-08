"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Bell } from "lucide-react";

export interface AttentionItem {
  id: string;
  href: string;
  label: string;
  detail: string;
  // A rendered element, not a component reference — LucideIcon function
  // values can't cross the server→client boundary (this is a client
  // component), but an already-rendered icon element can.
  icon: ReactNode;
  /** Qué tan urgente es, decidido donde se construye el item y no donde se
   *  pinta. "roto" es algo que dejó de funcionar y el dueño tiene que
   *  arreglar; "pendiente" es algo que lo espera a él; "neutro" es un aviso
   *  con tiempo. Va aquí, en el dato, porque el panel de inicio y la
   *  campana lo pintan distinto y no deben cada uno adivinar la urgencia a
   *  partir del texto. */
  tono: "roto" | "pendiente" | "neutro";
}

/** Every item here is derived live from real rows (content stuck in
 * review/failed, unanswered interactions, an ending beta trial) — there's
 * no notifications table, so nothing here can go stale or point at
 * something that's already been resolved. */
export function NotificationBell({ items }: { items: AttentionItem[] }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificaciones"
        aria-expanded={open}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-900"
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} />
        {items.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-20 w-72 rounded-2xl border border-zinc-200 bg-white p-2 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.25)] sm:w-80">
          {items.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-zinc-400">Todo al día — sin pendientes.</p>
          ) : (
            <div className="flex flex-col divide-y divide-zinc-100">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-2.5 rounded-xl p-2.5 text-left transition-colors hover:bg-zinc-50"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-900">{item.label}</p>
                    <p className="truncate text-xs text-zinc-500">{item.detail}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
