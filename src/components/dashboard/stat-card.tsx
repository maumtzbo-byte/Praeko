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
  return (
    <Card className={cn("bg-white/70", className)}>
      <CardContent className="flex flex-col gap-2 p-4 sm:gap-3 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium tracking-wide text-zinc-500 sm:text-xs">{label}</span>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-white to-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.15)_inset,0_2px_6px_rgba(0,0,0,0.06)] sm:h-8 sm:w-8">
            <Icon className="h-3.5 w-3.5 text-accent sm:h-4 sm:w-4" strokeWidth={1.75} />
          </span>
        </div>
        <div>
          <p className="text-xl font-semibold tracking-tight text-zinc-950 sm:text-2xl">{value}</p>
          {sublabel && <p className="mt-0.5 text-xs text-zinc-500">{sublabel}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
