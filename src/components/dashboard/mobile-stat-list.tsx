import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface MobileStatRow {
  icon: ReactNode;
  label: string;
  value: string;
  changePct?: number | null;
  showTrend?: boolean;
}

/**
 * Compresses a group of stat tiles into one flat card with divided rows,
 * mobile-only (desktop keeps the per-metric tile grid). Stacking a
 * separate card per metric — even a flat one — repeats that card's own
 * padding/border/gap on every row, which uses *more* vertical space than
 * the tile grid it replaced. Shopify and Stripe's mobile dashboards avoid
 * that by putting several metrics in a single list, the same divided-row
 * pattern this dashboard already uses for "Actividad reciente".
 */
export function MobileStatList({ rows }: { rows: MobileStatRow[] }) {
  return (
    <Card className="lg:hidden">
      <CardContent className="flex flex-col divide-y divide-zinc-100 p-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              {row.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-zinc-500">{row.label}</p>
              <p className="truncate text-base font-semibold tracking-tight text-zinc-950">{row.value}</p>
            </div>
            {row.showTrend && row.changePct != null && (
              <span
                className={cn("shrink-0 text-xs font-medium", row.changePct >= 0 ? "text-emerald-600" : "text-red-600")}
              >
                {row.changePct >= 0 ? "↑" : "↓"} {Math.abs(row.changePct)}%
              </span>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
