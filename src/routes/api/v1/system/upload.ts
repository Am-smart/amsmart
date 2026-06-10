import { createFileRoute } from "@tanstack/react-router";
import { withHandler } from "@/lib/api/api-utils";
import { systemService } from "@/lib/services";
import { BadRequestError } from "@/lib/api-error";

const POST = withHandler(async (user, request) => {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const category = (formData.get("category") as string) || "general";
  if (!file) throw new BadRequestError("No file provided");
  return systemService.uploadFile(file, category, user.id, user.sessionId!);
});

export const Route = createFileRoute("/api/v1/system/upload")({
  server: {
    handlers: {
      POST: ({ request }) => POST(request),
    },
  },
});
