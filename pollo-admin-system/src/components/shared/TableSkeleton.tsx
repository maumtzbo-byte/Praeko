import { Skeleton } from '@/components/ui/skeleton'

export function TableSkeleton({
  rows = 5,
  columns = 4,
  header = true,
}: {
  rows?: number
  columns?: number
  header?: boolean
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {header && (
        <div className="flex items-center gap-4 border-b border-border bg-muted/40 px-4 py-3">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-3.5 flex-1" />
          ))}
        </div>
      )}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
