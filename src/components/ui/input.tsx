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
          // Un pozo, no una caja: el campo se hunde porque algo entra
          // ahí. Es la aplicación más literal del material y la que hace
          // que el formulario se lea sin instrucciones — lo hundido se
          // llena, lo levantado se oprime.
          "h-11 w-full rounded-xl bg-white px-3.5 text-sm text-zinc-900 outline-none transition-shadow placeholder:text-zinc-400",
          "shadow-[var(--relieve-pozo)] focus:shadow-[var(--relieve-pozo),0_0_0_3.5px_rgba(61,117,173,0.16)]",
          invalid
            ? "shadow-[var(--relieve-pozo),0_0_0_1.5px_rgba(180,35,24,0.55)] focus:shadow-[var(--relieve-pozo),0_0_0_3.5px_rgba(180,35,24,0.18)] "
            : "",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
