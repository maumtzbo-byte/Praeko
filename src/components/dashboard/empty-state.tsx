import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-3xl border border-[var(--hairline)] bg-white/50 px-6 py-16 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)_inset] dark:bg-zinc-900/50">
      {/* A warm wash behind the icon, not just gray-on-gray — the same
          accent used across the marketing site, so "no data yet" still
          feels like Praeko instead of a bare generic placeholder. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-6 h-36 w-36 -translate-x-1/2 rounded-full opacity-[0.16] blur-3xl"
        style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
      />
      <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-white to-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.15)_inset,0_4px_10px_rgba(0,0,0,0.08)] dark:from-zinc-700 dark:to-zinc-800">
        <Icon className="h-6 w-6 text-accent" strokeWidth={1.5} />
      </span>
      <h3 className="relative text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      <p className="relative max-w-sm text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      {action && <div className="relative mt-1">{action}</div>}
    </div>
  );
}
