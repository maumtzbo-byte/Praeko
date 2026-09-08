import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

// Un botón es una pieza que se oprime, así que se modela como tal: sale de
// la página en reposo y se hunde al presionarla. El desplazamiento de 1px
// en :active va junto con el cambio de sombra a propósito — solo cambiando
// la sombra el botón parpadea, no se siente que baja.
//
// `ghost` se queda plano y es intencional: no es un objeto, es texto que
// se puede tocar. Si también tuviera relieve, dejaría de distinguirse del
// botón secundario y la jerarquía se perdería.
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[image:var(--plastico-oscuro)] text-white shadow-[var(--relieve-oscuro)] " +
    "hover:brightness-110 active:translate-y-px active:shadow-[var(--relieve-oprimido)] " +
    "disabled:hover:brightness-100 ",
  secondary:
    "bg-[image:var(--plastico)] text-zinc-800 shadow-[var(--relieve-pieza)] " +
    "hover:brightness-[1.02] active:translate-y-px active:shadow-[var(--relieve-oprimido)] ",
  ghost: "text-zinc-600 hover:bg-zinc-900/[0.055] active:bg-zinc-900/[0.09] ",
  destructive:
    "bg-[linear-gradient(180deg,#e04b3f_0%,#c8342a_55%,#a8261b_100%)] text-white shadow-[var(--relieve-oscuro)] " +
    "hover:brightness-110 active:translate-y-px active:shadow-[var(--relieve-oprimido)] ",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", loading, disabled, children, ...props },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all disabled:cursor-not-allowed disabled:opacity-60",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button };
