import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/help")({
  head: () => ({ meta: [{ title: "Help Center — SmartLMS" }] }),
  component: Page,
});

// TODO: port UI from legacy Next.js /help page.
function Page() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Help Center</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Migrated route skeleton. Port the original page contents here.
      </p>
    </section>
  );
}
