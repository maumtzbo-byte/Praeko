"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { SidebarNav } from "./sidebar-nav";

export function DashboardShell({
  businessName,
  children,
}: {
  businessName: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-zinc-200 bg-white/80 backdrop-blur-sm lg:block">
        <SidebarNav businessName={businessName} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
            <button
              className="absolute right-3 top-3 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100"
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menú"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarNav businessName={businessName} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-zinc-200 bg-[var(--background)]/80 px-4 py-3 backdrop-blur-sm lg:hidden">
          <button
            className="rounded-lg p-1.5 text-zinc-700 hover:bg-zinc-100"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold tracking-[0.2em] text-zinc-950">PRAEKO</span>
        </header>

        <main className="px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
