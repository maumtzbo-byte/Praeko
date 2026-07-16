import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type AlertVariant = "error" | "success" | "info";

const variantStyles: Record<AlertVariant, { wrap: string; icon: ReactNode }> = {
  error: {
    wrap: "border-red-200 bg-red-50 text-red-700",
    icon: <AlertTriangle className="h-4 w-4 shrink-0" />,
  },
  success: {
    wrap: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: <CheckCircle2 className="h-4 w-4 shrink-0" />,
  },
  info: {
    wrap: "border-zinc-200 bg-zinc-50 text-zinc-700",
    icon: <Info className="h-4 w-4 shrink-0" />,
  },
};

export function Alert({
  variant = "info",
  children,
  className,
}: {
  variant?: AlertVariant;
  children: ReactNode;
  className?: string;
}) {
  const styles = variantStyles[variant];
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl border px-3.5 py-3 text-sm",
        styles.wrap,
        className,
      )}
      role={variant === "error" ? "alert" : "status"}
    >
      {styles.icon}
      <div>{children}</div>
    </div>
  );
}
