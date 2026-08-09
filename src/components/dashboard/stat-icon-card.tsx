import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Icon + label/value + trend, each stat in its own card — used for the
 * 2-column mobile stat grid (matches the reference layout) instead of one
 * shared divided-row list. */
export function StatIconCard({
  icon,
  label,
  value,
  changePct,
  showTrend,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  changePct?: number | null;
  showTrend?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-zinc-500">{label}</p>
          <p className="truncate text-lg font-semibold tracking-tight text-zinc-950">{value}</p>
        </div>
        {showTrend && changePct != null && (
          <span className={cn("shrink-0 text-xs font-medium", changePct >= 0 ? "text-emerald-600" : "text-red-600")}>
            {changePct >= 0 ? "↑" : "↓"} {Math.abs(changePct)}%
          </span>
        )}
      </CardContent>
    </Card>
  );
}
