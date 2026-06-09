import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/teacher/live")({
  head: () => ({ meta: [{ title: "Teacher Live — SmartLMS" }] }),
  component: Page,
});

// TODO: port UI from legacy Next.js /teacher/live page.
function Page() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Teacher Live</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Migrated route skeleton. Port the original page contents here.
      </p>
    </section>
  );
}
