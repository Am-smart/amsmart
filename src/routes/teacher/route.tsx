import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BaseDashboardLayout } from "@/components/layout/BaseDashboardLayout";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export const Route = createFileRoute("/teacher")({
  ssr: false,
  component: TeacherLayout,
});

function TeacherLayout() {
  return (
    <BaseDashboardLayout requiredRole="teacher" HeaderComponent={DashboardHeader}>
      <Outlet />
    </BaseDashboardLayout>
  );
}
