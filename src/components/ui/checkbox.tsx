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
            "peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-md border border-zinc-300 bg-white transition-colors checked:border-zinc-950 checked:bg-zinc-950",
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
