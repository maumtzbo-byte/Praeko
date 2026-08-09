"use client";

import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import { SOCIAL_PLATFORM_LABELS, SOCIAL_PLATFORM_COLORS, type SocialPlatform } from "@/lib/social";

export interface FollowerSeries {
  platform: SocialPlatform;
  currentFollowers: number;
  points: { date: string; followers: number }[];
}

const RANGES = [
  { label: "7 días", days: 7 },
  { label: "30 días", days: 30 },
] as const;

const dateFormatter = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" });

/** Sum of every series' follower count on a given date — only counts a
 * date where every connected platform actually has a snapshot, so a newly
 * connected account mid-window can't silently drag the combined total down. */
function totalFollowersOn(series: FollowerSeries[], date: string): number | null {
  const values = series.map((s) => s.points.find((p) => p.date === date)?.followers);
  if (values.some((v) => v === undefined)) return null;
  return values.reduce<number>((sum, v) => sum + (v ?? 0), 0);
}

function daysAgoStr(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/**
 * There's no way to backfill past follower counts — Meta/TikTok don't
 * expose that — so this can only show a real trend once at least 2 days
 * of snapshots exist, and the week-over-week callouts only once 8 (or 15)
 * real days have accumulated. Every number here is a real snapshot
 * comparison, never estimated.
 */
export function FollowerGrowthChart({ series }: { series: FollowerSeries[] }) {
  const [rangeDays, setRangeDays] = useState<number>(7);
  const hasTrend = series.some((s) => new Set(s.points.map((p) => p.date)).size >= 2);

  const todayStr = daysAgoStr(0);
  const totalToday = totalFollowersOn(series, todayStr);
  const totalWeekAgo = totalFollowersOn(series, daysAgoStr(7));
  const totalTwoWeeksAgo = totalFollowersOn(series, daysAgoStr(14));

  const weeklyDelta = totalToday !== null && totalWeekAgo !== null ? totalToday - totalWeekAgo : null;
  const previousWeeklyDelta = totalWeekAgo !== null && totalTwoWeeksAgo !== null ? totalWeekAgo - totalTwoWeeksAgo : null;
  const weeklyDeltaChangePct =
    weeklyDelta !== null && previousWeeklyDelta !== null && previousWeeklyDelta !== 0
      ? Math.round(((weeklyDelta - previousWeeklyDelta) / Math.abs(previousWeeklyDelta)) * 1000) / 10
      : null;

  const allDates = useMemo(() => Array.from(new Set(series.flatMap((s) => s.points.map((p) => p.date)))).sort(), [series]);
  const visibleDates = useMemo(() => allDates.slice(-rangeDays), [allDates, rangeDays]);
  const rows = useMemo(
    () =>
      visibleDates.map((date) => {
        const row: Record<string, number | string> = { date };
        for (const s of series) {
          const point = s.points.find((p) => p.date === date);
          if (point) row[s.platform] = point.followers;
        }
        return row;
      }),
    [visibleDates, series],
  );

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

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
          {series.map((s) => (
            <span key={s.platform} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: SOCIAL_PLATFORM_COLORS[s.platform] }} />
              {SOCIAL_PLATFORM_LABELS[s.platform]}
            </span>
          ))}
        </div>
        <div className="flex gap-0.5 rounded-lg bg-zinc-100 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setRangeDays(r.days)}
              className={cn(
                "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                rangeDays === r.days ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-40 w-full sm:h-64">
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
            <Legend wrapperStyle={{ display: "none" }} />
            {series.map((s) => (
              <Line
                key={s.platform}
                type="monotone"
                dataKey={s.platform}
                name={s.platform}
                stroke={SOCIAL_PLATFORM_COLORS[s.platform]}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {(weeklyDelta !== null || weeklyDeltaChangePct !== null) && (
        <div className="grid grid-cols-2 gap-3">
          {weeklyDelta !== null && (
            <div className="rounded-xl border border-zinc-200 p-3">
              <p className={cn("text-lg font-semibold", weeklyDelta >= 0 ? "text-emerald-600" : "text-red-600")}>
                {weeklyDelta >= 0 ? "+" : ""}
                {weeklyDelta.toLocaleString("es-MX")}
              </p>
              <p className="text-xs text-zinc-500">seguidores esta semana</p>
            </div>
          )}
          {weeklyDeltaChangePct !== null && (
            <div className="flex items-center justify-between rounded-xl border border-zinc-200 p-3">
              <div>
                <p className={cn("flex items-center gap-1 text-lg font-semibold", weeklyDeltaChangePct >= 0 ? "text-emerald-600" : "text-red-600")}>
                  {weeklyDeltaChangePct >= 0 ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  {Math.abs(weeklyDeltaChangePct)}%
                </p>
                <p className="text-xs text-zinc-500">vs. semana anterior</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
