import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/student/materials")({
  head: () => ({ meta: [{ title: "Student Materials — SmartLMS" }] }),
  component: Page,
});

// TODO: port UI from legacy Next.js /student/materials page.
function Page() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Student Materials</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Migrated route skeleton. Port the original page contents here.
      </p>
    </section>
  );
}
