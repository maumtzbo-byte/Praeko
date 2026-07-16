import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400",
          "focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100",
          invalid
            ? "border-red-400 focus:border-red-400 focus:ring-red-100"
            : "border-zinc-200",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
