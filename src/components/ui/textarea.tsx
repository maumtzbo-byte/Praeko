import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          // Mismo pozo que Input, ver ahí.
          "min-h-[100px] w-full rounded-xl bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition-shadow placeholder:text-zinc-400",
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
Textarea.displayName = "Textarea";

export { Textarea };
