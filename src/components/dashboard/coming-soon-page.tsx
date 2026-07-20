import type { LucideIcon } from "lucide-react";
import { PageHeader } from "./page-header";
import { EmptyState } from "./empty-state";

export function ComingSoonPage({
  icon,
  title,
  description,
  emptyTitle,
  emptyDescription,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  action?: React.ReactNode;
}) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} action={action} />
    </div>
  );
}
