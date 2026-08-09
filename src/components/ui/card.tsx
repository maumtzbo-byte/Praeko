import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** `mobileFlat` trades the glassy shadow/blur card look for a plain
 * white card with a thin border below the `sm` breakpoint only — the
 * softer, flatter list style Shopify's mobile dashboard uses — while
 * leaving every card unchanged at `sm` and up. */
export function Card({
  className,
  mobileFlat,
  ...props
}: HTMLAttributes<HTMLDivElement> & { mobileFlat?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-zinc-200/80 bg-white/70 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_16px_36px_-22px_rgba(0,0,0,0.18)] backdrop-blur-sm",
        mobileFlat &&
          "rounded-2xl border-zinc-200 bg-white shadow-none backdrop-blur-none sm:rounded-3xl sm:border-zinc-200/80 sm:bg-white/70 sm:shadow-[0_1px_2px_rgba(0,0,0,0.03),0_16px_36px_-22px_rgba(0,0,0,0.18)] sm:backdrop-blur-sm",
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
      className={cn("text-base font-semibold text-zinc-900", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-zinc-500", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...props} />;
}
