/**
 * Public certificate verification. Returns only non-PII presentation fields
 * (code, title, recipient display name, course title, issue date, validity).
 * No session, no listing — a single code lookup per request.
 */
import { createFileRoute } from "@tanstack/react-router";
import { certificateService } from "@/lib/services";
import { getErrorMessage, mapErrorToStatus } from "@/lib/api-error";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export const Route = createFileRoute("/api/public/v1/certificates/verify")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const code = new URL(request.url).searchParams.get("code") ?? "";
        try {
          const result = await certificateService.verify(code);
          if (!result) return json({ success: true, data: { valid: false, found: false } });
          return json({ success: true, data: { ...result, found: true } });
        } catch (error) {
          return json({ success: false, error: getErrorMessage(error) }, mapErrorToStatus(error));
        }
      },
    },
  },
});
