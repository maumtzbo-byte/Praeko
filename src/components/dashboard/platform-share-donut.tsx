"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { SOCIAL_PLATFORM_LABELS, SOCIAL_PLATFORM_COLORS } from "@/lib/social";
import type { PlatformInteractionShare } from "@/lib/agents/results-agent";

/**
 * A genuine share-of-whole donut — each slice is a platform's real share
 * of total interactions, so (unlike the per-platform engagement rate
 * rings) these percentages legitimately sum to 100.
 */
export function PlatformShareDonut({
  data,
  layout = "stacked",
}: {
  data: PlatformInteractionShare[];
  /** "side-by-side" places the chart and legend in one row instead of
   * stacking the legend below — used for the mobile home's standalone card. */
  layout?: "stacked" | "side-by-side";
}) {
  if (data.length === 0) {
    return <p className="text-sm text-zinc-500">Sin datos de interacciones por red todavía.</p>;
  }

  const chart = (
    <div className={layout === "side-by-side" ? "h-32 w-32 shrink-0" : "h-32 w-full sm:h-40"}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          {/* Percentage radii instead of fixed pixels — a fixed 45/70px
              pie overflowed the smaller side-by-side container (112px)
              and got clipped into a malformed shape. Percentages scale
              to whichever container this renders in. */}
          <Pie data={data} dataKey="interactions" nameKey="platform" innerRadius="60%" outerRadius="90%" paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.platform} fill={SOCIAL_PLATFORM_COLORS[entry.platform]} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: unknown) => `${Number(value ?? 0).toLocaleString("es-MX")} interacciones`}
            labelFormatter={(name: unknown) =>
              SOCIAL_PLATFORM_LABELS[String(name) as keyof typeof SOCIAL_PLATFORM_LABELS] ?? String(name)
            }
            contentStyle={{ borderRadius: 12, border: "1px solid #e4e4e7", fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  if (layout === "side-by-side") {
    return (
      <div className="flex items-center gap-6">
        {chart}
        <div className="flex flex-col gap-2.5">
          {data.map((entry) => (
            <div key={entry.platform} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: SOCIAL_PLATFORM_COLORS[entry.platform] }} />
              <span className="text-zinc-700">{SOCIAL_PLATFORM_LABELS[entry.platform]}</span>
              <span className="ml-auto pl-4 font-medium text-zinc-900">{entry.sharePct}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {chart}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-zinc-500">
        {data.map((entry) => (
          <span key={entry.platform} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ background: SOCIAL_PLATFORM_COLORS[entry.platform] }} />
            {SOCIAL_PLATFORM_LABELS[entry.platform]} · {entry.sharePct}%
          </span>
        ))}
      </div>
    </div>
  );
}
