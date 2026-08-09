import { Skeleton } from "@/components/ui/skeleton";

/** Matches PageHeader's icon-badge + title + description shape and spacing,
 * so a route's loading.tsx renders in the same position/size as the real
 * header instead of the page jumping once data arrives. */
export function PageHeaderSkeleton() {
  return (
    <div className="mb-8 flex items-start gap-3">
      <Skeleton className="mt-0.5 h-9 w-9 shrink-0 rounded-xl" />
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>
  );
}
