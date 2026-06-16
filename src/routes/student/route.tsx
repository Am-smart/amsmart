import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BaseDashboardLayout } from "@/components/layout/BaseDashboardLayout";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { useAppContext } from "@/components/AppContext";

export const Route = createFileRoute("/student")({
  ssr: false,
  component: StudentLayout,
});

function StudentLayout() {
  const { stats } = useAppContext();
  return (
    <BaseDashboardLayout
      requiredRole="student"
      HeaderComponent={DashboardHeader}
      headerProps={{ stats }}
    >
      <Outlet />
    </BaseDashboardLayout>
  );
}
