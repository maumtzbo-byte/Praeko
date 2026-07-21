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
        "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        selected
          ? "border-zinc-950 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
          : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600",
        className,
      )}
    >
      {icon && (
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            selected ? "bg-white/15 dark:bg-zinc-950/10" : "bg-zinc-100 dark:bg-zinc-800",
          )}
        >
          {icon}
        </span>
      )}
      <span className="text-sm font-medium">{label}</span>
      {description && (
        <span className={cn("text-xs", selected ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-500 dark:text-zinc-400")}>
          {description}
        </span>
      )}
    </button>
  );
}
