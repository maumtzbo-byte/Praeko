import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, invalid, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            // Mismo pozo que Input, ver ahí.
            "h-11 w-full appearance-none rounded-xl bg-white px-3.5 pr-9 text-sm text-zinc-900 outline-none transition-shadow",
            "shadow-[var(--relieve-pozo)] focus:shadow-[var(--relieve-pozo),0_0_0_3.5px_rgba(61,117,173,0.16)]",
            invalid ? "shadow-[var(--relieve-pozo),0_0_0_1.5px_rgba(180,35,24,0.55)]" : "",
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };
