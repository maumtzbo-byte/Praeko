import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function OptionCard({
  selected,
  onClick,
  icon,
  label,
  description,
  className,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: ReactNode;
  label: string;
  description?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex flex-col items-start gap-2 rounded-2xl p-4 text-left transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        // Sin elegir sobresale, elegida se queda hundida y oscura: la
        // opción que ya tomaste dejó de ser un botón por oprimir.
        selected
          ? "bg-[image:var(--plastico-oscuro)] text-white shadow-[var(--relieve-oscuro)] "
          : "bg-[image:var(--plastico)] text-zinc-800 shadow-[var(--relieve-pieza)] hover:brightness-[1.02] active:translate-y-px active:shadow-[var(--relieve-oprimido)] ",
        className,
      )}
    >
      {icon && (
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            selected
              ? "bg-white/10 shadow-[inset_0_1px_2px_rgba(0,0,0,0.45)]"
              : "bg-zinc-100 shadow-[var(--relieve-hundido)]",
          )}
        >
          {icon}
        </span>
      )}
      <span className="text-sm font-medium">{label}</span>
      {description && (
        <span className={cn("text-xs", selected ? "text-zinc-300" : "text-zinc-500")}>
          {description}
        </span>
      )}
    </button>
  );
}
