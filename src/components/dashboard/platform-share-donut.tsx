"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { SOCIAL_PLATFORM_LABELS, SOCIAL_PLATFORM_COLORS } from "@/lib/social";
import type { PlatformInteractionShare } from "@/lib/agents/results-agent";

/**
 * A genuine share-of-whole donut — each slice is a platform's real share
 * of total interactions, so (unlike the per-platform engagement rate
 * rings) these percentages legitimately sum to 100.
 */
export function PlatformShareDonut({ data }: { data: PlatformInteractionShare[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-zinc-500">Sin datos de interacciones por red todavía.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="h-32 w-full sm:h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="interactions" nameKey="platform" innerRadius={45} outerRadius={70} paddingAngle={2}>
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
