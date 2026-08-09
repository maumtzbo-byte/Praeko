import Link from "next/link";
import { Check, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ChecklistStep {
  label: string;
  href: string;
  done: boolean;
  icon: LucideIcon;
}

/** Shown on the dashboard home only until every step is done — once a
 * business is up and running this would just be noise, not help. Icon-tile
 * grid instead of a plain list — each step reuses the same icon its own
 * page/quick-action already shows elsewhere, so this isn't a new visual
 * vocabulary, just a bigger version of it. */
export function OnboardingChecklist({ steps, className }: { steps: ChecklistStep[]; className?: string }) {
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;

  return (
    <Card className={cn("border-accent/20 bg-accent/[0.04]", className)}>
      <CardContent className="flex flex-col gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Primeros pasos</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {doneCount} de {steps.length} listos — termina para que Frames publique solo.
            </p>
          </div>
          <span className="shrink-0 text-xs font-medium text-accent">
            {Math.round((doneCount / steps.length) * 100)}%
          </span>
        </div>
        <Progress value={(doneCount / steps.length) * 100} />
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Link
                key={step.href}
                href={step.href}
                className="group relative flex flex-col items-center gap-2 rounded-2xl px-3 py-4 text-center transition-colors hover:bg-white"
              >
                <span
                  className={cn(
                    "relative flex h-11 w-11 items-center justify-center rounded-2xl",
                    step.done ? "bg-accent text-white" : "bg-accent/10 text-accent",
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                  {step.done && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-2 ring-[var(--background)]">
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium leading-tight",
                    step.done ? "text-zinc-400 line-through decoration-zinc-300" : "text-zinc-700 group-hover:text-zinc-900",
                  )}
                >
                  {step.label}
                </span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
