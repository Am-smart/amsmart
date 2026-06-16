import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BaseDashboardLayout } from "@/components/layout/BaseDashboardLayout";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

// Pathless role shell. SSR is disabled because the legacy AppProvider
// (IndexedDB, localStorage, window APIs) runs client-only.
export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <BaseDashboardLayout requiredRole="admin" HeaderComponent={DashboardHeader}>
      <Outlet />
    </BaseDashboardLayout>
  );
}
