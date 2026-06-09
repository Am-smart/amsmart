import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/student/anti-cheat")({
  head: () => ({ meta: [{ title: "Student Anti cheat — SmartLMS" }] }),
  component: Page,
});

// TODO: port UI from legacy Next.js /student/anti-cheat page.
function Page() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Student Anti cheat</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Migrated route skeleton. Port the original page contents here.
      </p>
    </section>
  );
}
