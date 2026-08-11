"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { FramesMark } from "@/components/brand/FramesMark";
import { PRIMARY_NAV_GROUPS, SECONDARY_NAV_ITEMS, type NavItem } from "@/lib/dashboard/nav-items";
import { WorkspaceSwitcher } from "./workspace-switcher";
import type { BusinessSummary } from "@/lib/dashboard/get-current-business";
import { cn } from "@/lib/utils";

function NavLink({
  item,
  onNavigate,
  showAttentionDot,
}: {
  item: NavItem;
  onNavigate?: () => void;
  showAttentionDot?: boolean;
}) {
  const pathname = usePathname();
  const active = item.href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-accent text-white "
          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 ",
      )}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
      <span className="flex-1 truncate">{item.label}</span>
      {/* Set the expectation before the click, not after — landing on a
          "coming soon" page reads as broken; seeing the tag in the nav
          first reads as a roadmap. */}
      {item.comingSoon && (
        <span
          className={cn(
            "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
            active
              ? "bg-white/15 text-white "
              : "bg-zinc-100 text-zinc-500 ",
          )}
        >
          Pronto
        </span>
      )}
      {/* A quiet "this needs you" signal on Mi plan — same small-dot language
          as the marketing site's live badge, not a loud red alert, since an
          unactivated plan isn't an error, just an open opportunity. */}
      {showAttentionDot && !active && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
      {showAttentionDot && active && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-white" />}
    </Link>
  );
}

export function SidebarNav({
  businessId,
  businesses,
  needsPlanAttention = false,
  onNavigate,
}: {
  businessId: string;
  businesses: BusinessSummary[];
  needsPlanAttention?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto px-4 py-6">
      <Link href="/dashboard" className="flex items-center gap-2 px-2 text-lg font-semibold tracking-[0.2em] text-zinc-950">
        <FramesMark className="h-5 w-5" />
        FRAMES
      </Link>

      <WorkspaceSwitcher businesses={businesses} activeBusinessId={businessId} onNavigate={onNavigate} />

      <nav className="flex flex-1 flex-col gap-1">
        {PRIMARY_NAV_GROUPS.map((group, i) => (
          <div key={group.label ?? i} className={i > 0 ? "mt-3" : undefined}>
            {group.label && (
              <p className="mb-1 px-3 text-[11px] font-semibold tracking-[0.08em] text-zinc-400 uppercase">
                {group.label}
              </p>
            )}
            <div className="flex flex-col gap-1">
              {group.items.map((item) => (
                <NavLink key={item.href} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
        <div className="my-2 border-t border-zinc-200" />
        {SECONDARY_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            onNavigate={onNavigate}
            showAttentionDot={needsPlanAttention && item.href === "/dashboard/plan"}
          />
        ))}
      </nav>

      <form action="/auth/logout" method="post">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 "
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
