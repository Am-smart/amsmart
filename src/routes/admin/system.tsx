import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/system")({
  head: () => ({ meta: [{ title: "Admin System — SmartLMS" }] }),
  component: Page,
});

// TODO: port UI from legacy Next.js /admin/system page.
function Page() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Admin System</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Migrated route skeleton. Port the original page contents here.
      </p>
    </section>
  );
}
