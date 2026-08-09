"use client";

import { useId, type ReactNode } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Compact stat tile with an embedded trend line — used for the top
 * metrics row where a full axis-labeled chart would be overkill. Both
 * the sparkline and the % change badge are opt-in via `showTrend`: a
 * metric with under 2 real days of history renders as a plain number
 * instead of implying a trend that doesn't exist yet.
 *
 * `icon` takes a rendered element, not a component reference — LucideIcon
 * function values can't cross the server→client boundary (this is a
 * client component), but an already-rendered icon element can. */
export function StatSparkCard({
  icon,
  label,
  value,
  sparkline,
  changePct,
  showTrend,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  sparkline: number[];
  changePct: number | null;
  showTrend: boolean;
}) {
  const gradientId = useId();
  const data = sparkline.map((v, i) => ({ i, v }));

  return (
    <Card className="bg-white/70">
      <CardContent className="flex flex-col gap-2 p-4 sm:gap-3 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
            {icon}
          </span>
          {showTrend && changePct !== null && (
            <span className={cn("text-xs font-medium", changePct >= 0 ? "text-emerald-600" : "text-red-600")}>
              {changePct >= 0 ? "↑" : "↓"} {Math.abs(changePct)}%
            </span>
          )}
        </div>
        <div>
          <p className="text-xs font-medium text-zinc-500">{label}</p>
          <p className="text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">{value}</p>
        </div>
        {showTrend && (
          <div className="h-8 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="var(--accent)" fill={`url(#${gradientId})`} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
