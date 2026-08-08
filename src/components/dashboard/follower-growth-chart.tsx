"use client";

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SOCIAL_PLATFORM_LABELS, type SocialPlatform } from "@/lib/social";

export interface FollowerSeries {
  platform: SocialPlatform;
  currentFollowers: number;
  points: { date: string; followers: number }[];
}

const TONES = ["var(--accent-strong)", "var(--accent)", "color-mix(in srgb, var(--accent) 55%, white)"];
const dateFormatter = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" });

/**
 * There's no way to backfill past follower counts — Meta/TikTok don't
 * expose that — so this can only show a real trend once at least 2 days
 * of snapshots exist. Before that, it's honest to show today's count as a
 * plain number instead of a one-point "chart" that implies more history
 * than actually exists.
 */
export function FollowerGrowthChart({ series }: { series: FollowerSeries[] }) {
  const hasTrend = series.some((s) => new Set(s.points.map((p) => p.date)).size >= 2);

  if (!hasTrend) {
    return (
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {series.map((s) => (
            <div key={s.platform} className="rounded-xl border border-zinc-200 p-3">
              <p className="text-xs text-zinc-500">{SOCIAL_PLATFORM_LABELS[s.platform]}</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">{s.currentFollowers.toLocaleString("es-MX")}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-400">
          Empezamos a rastrear tu crecimiento hoy — vuelve en unos días para ver la tendencia.
        </p>
      </div>
    );
  }

  const allDates = Array.from(new Set(series.flatMap((s) => s.points.map((p) => p.date)))).sort();
  const rows = allDates.map((date) => {
    const row: Record<string, number | string> = { date };
    for (const s of series) {
      const point = s.points.find((p) => p.date === date);
      if (point) row[s.platform] = point.followers;
    }
    return row;
  });

  return (
    <div className="h-52 w-full sm:h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#e4e4e7" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) => dateFormatter.format(new Date(value))}
            tick={{ fontSize: 11, fill: "#a1a1aa" }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis tick={{ fontSize: 11, fill: "#a1a1aa" }} axisLine={false} tickLine={false} width={40} allowDecimals={false} />
          <Tooltip
            labelFormatter={(value) => dateFormatter.format(new Date(String(value)))}
            contentStyle={{ borderRadius: 12, border: "1px solid #e4e4e7", fontSize: 12 }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            formatter={(value: string) => SOCIAL_PLATFORM_LABELS[value as SocialPlatform]}
          />
          {series.map((s, i) => (
            <Line
              key={s.platform}
              type="monotone"
              dataKey={s.platform}
              name={s.platform}
              stroke={TONES[i % TONES.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
