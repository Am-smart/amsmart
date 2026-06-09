import { createFileRoute, Outlet, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/student")({
  component: StudentLayout,
});

// Pathless role shell. Replace this placeholder with the original
// student sidebar/header components from the legacy app. Children render
// inside <Outlet />.
function StudentLayout() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-60 border-r p-4">
        <div className="mb-6 text-lg font-semibold">Student</div>
        <nav className="flex flex-col gap-1 text-sm">
          <Link to="/student" className="rounded px-2 py-1 hover:bg-accent">Dashboard</Link>
        </nav>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
