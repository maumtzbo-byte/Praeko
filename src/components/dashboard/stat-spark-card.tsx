import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** Label + badge in one row, big value below — no icon, no sparkline.
 * The % change badge is opt-in via `showTrend`: a metric with under 2
 * real days of history renders as a plain number instead of implying a
 * trend that doesn't exist yet. Only ever rendered inside the desktop
 * tile grid (mobile uses StatIconCard instead). */
export function StatSparkCard({
  label,
  value,
  changePct,
  showTrend,
}: {
  label: string;
  value: string;
  changePct: number | null;
  showTrend: boolean;
}) {
  return (
    <Card className="bg-white/70">
      <CardContent className="flex flex-col gap-2 p-5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-zinc-500">{label}</p>
          {showTrend && changePct !== null && (
            <span
              className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                changePct >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
              )}
            >
              {changePct >= 0 ? "+" : ""}
              {changePct}%
            </span>
          )}
        </div>
        <p className="text-2xl font-semibold tracking-tight text-zinc-950">{value}</p>
      </CardContent>
    </Card>
  );
}
