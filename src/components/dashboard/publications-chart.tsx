"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import type { DailyInsightsPoint } from "@/lib/agents/results-agent";

const RANGES = [
  { label: "7D", days: 7 },
  { label: "14D", days: 14 },
  { label: "30D", days: 30 },
] as const;

const dateFormatter = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" });
const compactNumberFormatter = new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 });

/** Client-side range filter only — the server already fetched the full
 * 30-day window once, so switching 7/14/30 never triggers another
 * Meta/TikTok call. */
export function PublicationsChart({ data }: { data: DailyInsightsPoint[] }) {
  const [rangeDays, setRangeDays] = useState<number>(14);
  const visible = useMemo(() => data.slice(-rangeDays), [data, rangeDays]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent" /> Alcance
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-accent-strong" /> Interacciones
          </span>
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
      <div className="h-48 w-full sm:h-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visible} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="fillAlcance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.35} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="fillInteracciones" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-strong)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--accent-strong)" stopOpacity={0} />
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
              contentStyle={{ borderRadius: 12, border: "1px solid #e4e4e7", fontSize: 12 }}
            />
            <Area type="monotone" dataKey="alcance" name="Alcance" stroke="var(--accent)" fill="url(#fillAlcance)" strokeWidth={2} />
            <Area
              type="monotone"
              dataKey="interacciones"
              name="Interacciones"
              stroke="var(--accent-strong)"
              fill="url(#fillInteracciones)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
