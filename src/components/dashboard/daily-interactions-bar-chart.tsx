"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { DailyInsightsPoint } from "@/lib/agents/results-agent";

const dateFormatter = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" });

/** Real per-day interaction totals (likes + comments + shares) from
 * already-published posts — the same series the follower/reach sparklines
 * draw from, just rendered as bars instead of a line. */
export function DailyInteractionsBarChart({ points }: { points: DailyInsightsPoint[] }) {
  const hasAnyData = points.some((p) => p.interacciones > 0);
  if (!hasAnyData) {
    return <p className="text-sm text-zinc-500">Sin interacciones registradas en este período.</p>;
  }

  return (
    <div className="h-32 w-full sm:h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={points} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) => dateFormatter.format(new Date(value))}
            tick={{ fontSize: 11, fill: "#a1a1aa" }}
            axisLine={false}
            tickLine={false}
            minTickGap={20}
          />
          <Tooltip
            labelFormatter={(value) => dateFormatter.format(new Date(String(value)))}
            formatter={(value: unknown) => [`${Number(value ?? 0).toLocaleString("es-MX")}`, "Interacciones"]}
            contentStyle={{ borderRadius: 12, border: "1px solid #e4e4e7", fontSize: 12 }}
          />
          <Bar dataKey="interacciones" fill="var(--accent)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
