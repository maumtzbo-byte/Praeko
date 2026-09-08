import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "neutral" | "success" | "warning" | "danger";

// Hundidas, no levantadas: una etiqueta se lee, no se toca. Es la
// contraparte del botón, y mantener esa distinción es lo que hace que el
// relieve signifique algo en vez de repartirse por toda la pantalla.
const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-zinc-100 text-zinc-700 ",
  success: "bg-emerald-50 text-emerald-800 ",
  warning: "bg-amber-50 text-amber-800 ",
  danger: "bg-red-50 text-red-800 ",
};

export function Badge({
  variant = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium shadow-[var(--relieve-hundido)]",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
