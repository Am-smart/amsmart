import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/teacher/grading")({
  head: () => ({ meta: [{ title: "Teacher Grading — SmartLMS" }] }),
  component: Page,
});

// TODO: port UI from legacy Next.js /teacher/grading page.
function Page() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Teacher Grading</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Migrated route skeleton. Port the original page contents here.
      </p>
    </section>
  );
}
