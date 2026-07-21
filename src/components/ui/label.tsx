import type { LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Label({
  className,
  required,
  children,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-medium text-zinc-800 dark:text-zinc-200", className)}
      {...props}
    >
      {children}
      {required && <span className="ml-0.5 text-zinc-400 dark:text-zinc-500">*</span>}
    </label>
  );
}
