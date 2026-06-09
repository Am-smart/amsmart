import { createFileRoute, Outlet, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/teacher")({
  component: TeacherLayout,
});

// Pathless role shell. Replace this placeholder with the original
// teacher sidebar/header components from the legacy app. Children render
// inside <Outlet />.
function TeacherLayout() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-60 border-r p-4">
        <div className="mb-6 text-lg font-semibold">Teacher</div>
        <nav className="flex flex-col gap-1 text-sm">
          <Link to="/teacher" className="rounded px-2 py-1 hover:bg-accent">Dashboard</Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
