"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import type { FollowerSeries } from "@/components/dashboard/follower-growth-chart";

const RANGES = [
  { label: "7 días", days: 7 },
  { label: "30 días", days: 30 },
  { label: "3 meses", days: 90 },
  { label: "Este año", days: 365 },
] as const;

const dateFormatter = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" });
const compactNumberFormatter = new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 });

function daysAgoStr(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

/** Suma de seguidores de todas las series en una fecha — solo cuenta una
 * fecha donde TODA plataforma que reporta tiene su medición, para que una
 * cuenta conectada a medio periodo no haga ver el total como una caída.
 *
 * "Que reporta" es la parte importante y es lo que faltaba: la serie llega
 * con una entrada por cada conexión, incluidas las que no tienen ni una
 * sola medición —token vencido, cuenta recién conectada, Google Business
 * que ni siquiera tiene seguidores—. Con esas adentro, `undefined` volvía
 * null SIEMPRE, y el render lo pintaba como `?? 0`: un cero enorme de
 * "seguidores" en la primera pantalla del celular, con datos buenos
 * atrás. El escritorio, que suma `currentFollowers`, mostraba el número
 * correcto en la misma pantalla. */
function seriesConDatos(series: FollowerSeries[]): FollowerSeries[] {
  return series.filter((s) => s.points.length > 0);
}

function totalFollowersOn(series: FollowerSeries[], date: string): number | null {
  const vivas = seriesConDatos(series);
  if (vivas.length === 0) return null;
  const values = vivas.map((s) => s.points.find((p) => p.date === date)?.followers);
  if (values.some((v) => v === undefined)) return null;
  return values.reduce<number>((sum, v) => sum + (v ?? 0), 0);
}

/** El total de la fecha completa más reciente. Hace falta porque la
 * medición de hoy se toma cuando el dueño abre el panel: antes de eso "hoy"
 * está incompleto y pedirlo a secas devolvía null, o sea otra vez el cero. */
function totalMasReciente(series: FollowerSeries[], fechas: string[]): number | null {
  for (let i = fechas.length - 1; i >= 0; i--) {
    const t = totalFollowersOn(series, fechas[i]);
    if (t !== null) return t;
  }
  return null;
}

/**
 * Single aggregated total-followers area chart with a hero number up top —
 * the mobile home's lead card. Real range buttons only ever show real
 * history: a business that started a week ago sees a flat/short line under
 * "3 meses" or "Este año" rather than a fabricated longer trend, since the
 * server fetch (captureAndFetchFollowerSeries) already caps at whatever
 * real snapshots exist.
 */
export function FollowerGrowthHero({ series }: { series: FollowerSeries[] }) {
  const [rangeDays, setRangeDays] = useState<number>(7);
  const hasTrend = series.some((s) => new Set(s.points.map((p) => p.date)).size >= 2);

  const fechas = useMemo(
    () => Array.from(new Set(series.flatMap((s) => s.points.map((p) => p.date)))).sort(),
    [series],
  );
  const totalToday = totalFollowersOn(series, daysAgoStr(0)) ?? totalMasReciente(series, fechas);
  const totalWeekAgo = totalFollowersOn(series, daysAgoStr(7));
  const weeklyChangePct =
    totalToday !== null && totalWeekAgo !== null && totalWeekAgo !== 0
      ? Math.round(((totalToday - totalWeekAgo) / totalWeekAgo) * 1000) / 10
      : null;

  const rows = useMemo(
    () =>
      fechas
        .map((date) => ({ date, total: totalFollowersOn(series, date) }))
        .filter((row): row is { date: string; total: number } => row.total !== null)
        .slice(-rangeDays),
    [fechas, series, rangeDays],
  );

  if (!hasTrend) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-2xl font-semibold tracking-tight text-zinc-950">
          {seriesConDatos(series).reduce((sum, s) => sum + s.currentFollowers, 0).toLocaleString("es-MX")}
        </p>
        <p className="text-xs text-zinc-400">
          Empezamos a rastrear tu crecimiento hoy — vuelve en unos días para ver la tendencia.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="text-3xl font-semibold tracking-tight text-zinc-950">{(totalToday ?? 0).toLocaleString("es-MX")}</p>
          {weeklyChangePct !== null && (
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                weeklyChangePct >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
              )}
            >
              {weeklyChangePct >= 0 ? "↑" : "↓"} {Math.abs(weeklyChangePct)}%
            </span>
          )}
        </div>
        {weeklyChangePct !== null && <p className="text-xs text-zinc-400">vs. 7 días anteriores</p>}
      </div>

      <div className="h-40 w-full sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fill-total-followers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#e4e4e7" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(value: string) => dateFormatter.format(new Date(value))}
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
              axisLine={false}
              tickLine={false}
              minTickGap={24}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
              axisLine={false}
              tickLine={false}
              width={40}
              allowDecimals={false}
              tickFormatter={(value: number) => compactNumberFormatter.format(value)}
            />
            <Tooltip
              labelFormatter={(value) => dateFormatter.format(new Date(String(value)))}
              formatter={(value: unknown) => [`${Number(value ?? 0).toLocaleString("es-MX")}`, "Seguidores"]}
              contentStyle={{ borderRadius: 12, border: "1px solid #e4e4e7", fontSize: 12 }}
            />
            <Area type="monotone" dataKey="total" stroke="var(--accent)" fill="url(#fill-total-followers)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {RANGES.map((r) => (
          <button
            key={r.days}
            type="button"
            onClick={() => setRangeDays(r.days)}
            className={cn(
              "rounded-full px-2 py-1.5 text-xs font-medium transition-colors",
              rangeDays === r.days
                ? "border border-zinc-200 bg-white text-accent shadow-sm"
                : "bg-zinc-100 text-zinc-500 hover:text-zinc-700",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
}
