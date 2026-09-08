import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    // Riel hundido, barra levantada: se ve como algo que llena un canal en
    // vez de como dos rectángulos de distinto color.
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-zinc-200/90 shadow-[var(--relieve-pozo)]", className)}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-accent/70 to-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition-all duration-500 ease-out "
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
