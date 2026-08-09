import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sublabel?: string;
  className?: string;
}) {
  // Only ever rendered inside the desktop tile grid (mobile shows
  // MobileStatList instead), so this stays a single stacked tile.
  return (
    <Card className={cn("bg-white/70", className)}>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium tracking-wide text-zinc-500">{label}</span>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-white to-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.15)_inset,0_2px_6px_rgba(0,0,0,0.06)]">
            <Icon className="h-3.5 w-3.5 text-accent" strokeWidth={1.75} />
          </span>
        </div>
        <div>
          <p className="text-2xl font-semibold tracking-tight text-zinc-950">{value}</p>
          {sublabel && <p className="mt-0.5 text-xs text-zinc-500">{sublabel}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
