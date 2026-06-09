import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/student/grades")({
  head: () => ({ meta: [{ title: "Student Grades — SmartLMS" }] }),
  component: Page,
});

// TODO: port UI from legacy Next.js /student/grades page.
function Page() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Student Grades</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Migrated route skeleton. Port the original page contents here.
      </p>
    </section>
  );
}
