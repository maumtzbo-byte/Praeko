import { getCurrentBusiness } from "@/lib/dashboard/get-current-business";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { business } = await getCurrentBusiness();

  return <DashboardShell businessName={business.name}>{children}</DashboardShell>;
}
