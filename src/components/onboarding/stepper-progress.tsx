import { Check } from "lucide-react";
import { ONBOARDING_STEPS, TOTAL_ONBOARDING_STEPS } from "@/lib/validation/onboarding";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function StepperProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          PASO {currentStep} DE {TOTAL_ONBOARDING_STEPS}
        </span>
        <span className="text-xs text-zinc-400 dark:text-zinc-500">
          {ONBOARDING_STEPS[currentStep - 1]?.title}
        </span>
      </div>
      <Progress value={(currentStep / TOTAL_ONBOARDING_STEPS) * 100} />
      <div className="mt-4 hidden gap-2 sm:flex">
        {ONBOARDING_STEPS.map((s) => (
          <div
            key={s.step}
            className={cn(
              "flex flex-1 items-center gap-1.5 text-[11px]",
              s.step === currentStep ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 dark:text-zinc-500",
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium",
                s.step < currentStep
                  ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                  : s.step === currentStep
                    ? "border border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100"
                    : "border border-zinc-300 text-zinc-400 dark:border-zinc-700 dark:text-zinc-500",
              )}
            >
              {s.step < currentStep ? <Check className="h-3 w-3" /> : s.step}
            </span>
            <span className="hidden truncate lg:inline">{s.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
