import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** No icon, no badge — just label, big value, optional sublabel. Only
 * ever rendered inside the desktop tile grid (mobile uses StatIconCard
 * instead). */
export function StatCard({
  label,
  value,
  sublabel,
  className,
}: {
  label: string;
  value: string;
  sublabel?: string;
  className?: string;
}) {
  return (
    <Card className={cn("bg-white/70", className)}>
      <CardContent className="flex flex-col gap-2 p-5">
        <p className="text-xs font-medium text-zinc-500">{label}</p>
        <div>
          <p className="text-2xl font-semibold tracking-tight text-zinc-950">{value}</p>
          {sublabel && <p className="mt-0.5 text-xs text-zinc-500">{sublabel}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
