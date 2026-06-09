import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/student/assignments")({
  head: () => ({ meta: [{ title: "Student Assignments — SmartLMS" }] }),
  component: Page,
});

// TODO: port UI from legacy Next.js /student/assignments page.
function Page() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Student Assignments</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Migrated route skeleton. Port the original page contents here.
      </p>
    </section>
  );
}
