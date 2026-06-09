import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/teacher/assignments")({
  head: () => ({ meta: [{ title: "Teacher Assignments — SmartLMS" }] }),
  component: Page,
});

// TODO: port UI from legacy Next.js /teacher/assignments page.
function Page() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Teacher Assignments</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Migrated route skeleton. Port the original page contents here.
      </p>
    </section>
  );
}
