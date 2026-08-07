import Link from "next/link";
import { Check, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ChecklistStep {
  label: string;
  href: string;
  done: boolean;
}

/** Shown on the dashboard home only until every step is done — once a
 * business is up and running this would just be noise, not help. */
export function OnboardingChecklist({ steps }: { steps: ChecklistStep[] }) {
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;

  return (
    <Card className="border-accent/20 bg-accent/[0.04]">
      <CardContent className="flex flex-col gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Primeros pasos</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {doneCount} de {steps.length} listos — termina para que Frames publique solo.
            </p>
          </div>
          <span className="shrink-0 text-xs font-medium text-zinc-500">
            {Math.round((doneCount / steps.length) * 100)}%
          </span>
        </div>
        <Progress value={(doneCount / steps.length) * 100} />
        <div className="flex flex-col gap-1">
          {steps.map((step) => (
            <Link
              key={step.href}
              href={step.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                step.done ? "text-zinc-400" : "text-zinc-800 hover:bg-white",
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  step.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-300 ",
                )}
              >
                {step.done && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <span className={cn("flex-1", step.done && "line-through decoration-zinc-300")}>{step.label}</span>
              {!step.done && <ArrowRight className="h-3.5 w-3.5 shrink-0 text-zinc-400" />}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
