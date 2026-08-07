import { FramesMark } from "@/components/brand/FramesMark";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        {/* Same icon-badge language as EmptyState/StatCard (gradient tile,
            accent-colored glyph) rather than the sidebar's flat black
            wordmark treatment — this is a new placement, not a recolor of
            the existing logo, so it follows the badges every other icon on
            this page already uses instead of introducing a second style. */}
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-white to-zinc-200 shadow-[0_1px_2px_rgba(0,0,0,0.15)_inset,0_2px_6px_rgba(0,0,0,0.06)]">
          <FramesMark className="h-4 w-4 text-accent" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
            {title}
          </h1>
          {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
