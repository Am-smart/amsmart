import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/management")({
  head: () => ({ meta: [{ title: "Admin Management — SmartLMS" }] }),
  component: Page,
});

// TODO: port UI from legacy Next.js /admin/management page.
function Page() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Admin Management</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Migrated route skeleton. Port the original page contents here.
      </p>
    </section>
  );
}
