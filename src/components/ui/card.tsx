import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-zinc-200/80 bg-white/70 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_16px_36px_-22px_rgba(0,0,0,0.18)] backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-[0_1px_2px_rgba(0,0,0,0.2),0_16px_36px_-22px_rgba(0,0,0,0.6)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-1 p-6 pb-0", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-semibold text-zinc-900 dark:text-zinc-100", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-zinc-500 dark:text-zinc-400", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...props} />;
}
