import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/help")({
  head: () => ({ meta: [{ title: "Admin Help — SmartLMS" }] }),
  component: Page,
});

// TODO: port UI from legacy Next.js /admin/help page.
function Page() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Admin Help</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Migrated route skeleton. Port the original page contents here.
      </p>
    </section>
  );
}
