import { PageHeaderSkeleton } from "@/components/dashboard/page-header-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function CampanasLoading() {
  return (
    <div>
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
