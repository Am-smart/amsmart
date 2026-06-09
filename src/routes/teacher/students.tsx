import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/teacher/students")({
  head: () => ({ meta: [{ title: "Teacher Students — SmartLMS" }] }),
  component: Page,
});

// TODO: port UI from legacy Next.js /teacher/students page.
function Page() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Teacher Students</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Migrated route skeleton. Port the original page contents here.
      </p>
    </section>
  );
}
