import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          ref={ref}
          type="checkbox"
          className={cn(
            // Vacía se hunde (es un hueco que espera algo), palomeada
            // sobresale (ya es una pieza puesta). Es el mismo par
            // hundido/levantado que usan el campo y el botón.
            "peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md bg-white shadow-[var(--relieve-pozo)] transition-all " +
            "checked:bg-[image:var(--plastico-oscuro)] checked:shadow-[var(--relieve-oscuro)] " +
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ",
            className,
          )}
          {...props}
        />
        <Check className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100" />
      </span>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
