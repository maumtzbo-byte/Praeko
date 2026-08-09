import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sublabel?: string;
  className?: string;
}) {
  return (
    <Card mobileFlat className={cn("bg-white/70", className)}>
      {/* Mobile: a flat list row (icon, label + value) instead of a
          stacked tile — the same Shopify-style row the sparkline stats
          use. Desktop keeps the original stacked tile unchanged. */}
      <CardContent className="flex items-center gap-3 p-4 sm:hidden">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-white to-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.15)_inset,0_2px_6px_rgba(0,0,0,0.06)]">
          <Icon className="h-4 w-4 text-accent" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-zinc-500">{label}</p>
          <p className="truncate text-lg font-semibold tracking-tight text-zinc-950">
            {value}
            {sublabel && <span className="ml-1.5 text-xs font-normal text-zinc-400">· {sublabel}</span>}
          </p>
        </div>
      </CardContent>

      <CardContent className="hidden flex-col gap-3 p-5 sm:flex">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium tracking-wide text-zinc-500">{label}</span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-white to-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.15)_inset,0_2px_6px_rgba(0,0,0,0.06)]">
            <Icon className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
          </span>
        </div>
        <div>
          <p className="text-2xl font-semibold tracking-tight text-zinc-950">{value}</p>
          {sublabel && <p className="mt-0.5 text-xs text-zinc-500">{sublabel}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
