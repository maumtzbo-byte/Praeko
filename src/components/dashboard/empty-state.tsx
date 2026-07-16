import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-zinc-300 bg-white/50 px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100">
        <Icon className="h-6 w-6 text-zinc-500" strokeWidth={1.5} />
      </span>
      <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
      <p className="max-w-sm text-sm text-zinc-500">{description}</p>
      {action}
    </div>
  );
}
