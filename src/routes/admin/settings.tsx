import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Admin Settings — SmartLMS" }] }),
  component: Page,
});

// TODO: port UI from legacy Next.js /admin/settings page.
function Page() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Admin Settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Migrated route skeleton. Port the original page contents here.
      </p>
    </section>
  );
}
