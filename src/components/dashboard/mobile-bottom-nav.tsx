"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Send, Megaphone, Share2, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

// Four fixed shortcuts, not a full copy of the sidebar — "Más" opens the
// same drawer the header hamburger already does, so nothing is lost, it's
// just reachable from the thumb-zone instead of a top corner. Generar
// contenido and Calendario used to each have their own tab here — both
// merged into Publicaciones (see nav-items.ts), so this points there now.
const TABS = [
  { href: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { href: "/dashboard/publicaciones", label: "Publicaciones", icon: Send },
  { href: "/dashboard/campanas", label: "Campañas", icon: Megaphone },
  { href: "/dashboard/redes-sociales", label: "Redes", icon: Share2 },
] as const;

export function MobileBottomNav({ onOpenMore }: { onOpenMore: () => void }) {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-zinc-200 bg-white/95 backdrop-blur-sm lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {TABS.map((tab) => {
        const active = tab.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(tab.href);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
              active ? "text-accent" : "text-zinc-500",
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.75} />
            {tab.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={onOpenMore}
        className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-zinc-500"
      >
        <Menu className="h-5 w-5" strokeWidth={1.75} />
        Más
      </button>
    </nav>
  );
}
