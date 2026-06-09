import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartLMS" },
      { name: "description", content: "Learning management for students, teachers, and admins." },
      { property: "og:title", content: "SmartLMS" },
      { property: "og:description", content: "Learning management for students, teachers, and admins." },
    ],
  }),
  component: Landing,
});

// TODO: port the original landing / login UI from the legacy Next.js
// `src/app/page.tsx`. For now this is a role chooser so the migrated
// route shells are reachable end-to-end.
function Landing() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold">SmartLMS</h1>
        <p className="mt-2 text-sm text-muted-foreground">Migration in progress.</p>
        <div className="mt-6 flex justify-center gap-3 text-sm">
          <Link to="/student" className="rounded-md border px-4 py-2 hover:bg-accent">Student</Link>
          <Link to="/teacher" className="rounded-md border px-4 py-2 hover:bg-accent">Teacher</Link>
          <Link to="/admin" className="rounded-md border px-4 py-2 hover:bg-accent">Admin</Link>
          <Link to="/help" className="rounded-md border px-4 py-2 hover:bg-accent">Help</Link>
        </div>
      </div>
    </div>
  );
}
