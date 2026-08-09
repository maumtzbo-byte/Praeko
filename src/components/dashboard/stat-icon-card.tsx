import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TONE_CLASSES = {
  violet: "bg-violet-50 text-violet-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  blue: "bg-blue-50 text-blue-600",
} as const;

export type StatIconTone = keyof typeof TONE_CLASSES;

/** Icon+label row, then value+trend row, then a "vs. 7 días anteriores"
 * caption — each stat in its own card for the 2-column mobile grid. */
export function StatIconCard({
  icon,
  label,
  value,
  changePct,
  showTrend,
  tone = "blue",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  changePct?: number | null;
  showTrend?: boolean;
  tone?: StatIconTone;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", TONE_CLASSES[tone])}>
            {icon}
          </span>
          <p className="text-sm text-zinc-600">{label}</p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-xl font-semibold tracking-tight text-zinc-950">{value}</p>
          {showTrend && changePct != null && (
            <span
              className={cn(
                "shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium",
                changePct >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
              )}
            >
              {changePct >= 0 ? "↑" : "↓"} {Math.abs(changePct)}%
            </span>
          )}
        </div>
        {showTrend && changePct != null && <p className="text-xs text-zinc-400">vs. 7 días anteriores</p>}
      </CardContent>
    </Card>
  );
}
