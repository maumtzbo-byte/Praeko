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
          ? "border-zinc-950 bg-zinc-950 text-white "
          : "border-zinc-200 bg-white text-zinc-800 hover:border-zinc-300 ",
        className,
      )}
    >
      {icon && (
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            selected ? "bg-white/15" : "bg-zinc-100",
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
