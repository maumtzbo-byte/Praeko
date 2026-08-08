"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { SOCIAL_PLATFORM_LABELS, type SocialPlatform } from "@/lib/social";
import type { PlatformBreakdown } from "@/lib/agents/results-agent";

// Tonal variations of the single brand accent, darkest to lightest — not a
// categorical palette, since Frames deliberately uses one accent color
// everywhere instead of a distinct hue per data series.
const TONES = [
  "var(--accent-strong)",
  "var(--accent)",
  "color-mix(in srgb, var(--accent) 55%, white)",
  "color-mix(in srgb, var(--accent) 30%, white)",
];

/** Ranked by real engagement share (see summarizeByPlatform) — which
 * network the audience actually responds on, not just where more got
 * posted. */
export function PlatformBreakdownDonut({ data }: { data: PlatformBreakdown[] }) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <div className="h-36 w-36 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="percentage"
              nameKey="platform"
              innerRadius="65%"
              outerRadius="100%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={entry.platform} fill={TONES[i % TONES.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [`${value}%`, SOCIAL_PLATFORM_LABELS[String(name) as SocialPlatform]]}
              contentStyle={{ borderRadius: 12, border: "1px solid #e4e4e7", fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex w-full flex-col gap-2">
        {data.map((entry, i) => (
          <div key={entry.platform} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2 text-zinc-600">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: TONES[i % TONES.length] }} />
              {SOCIAL_PLATFORM_LABELS[entry.platform]}
            </span>
            <span className="font-semibold text-zinc-900">{entry.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
