import { createFileRoute } from "@tanstack/react-router";
import { isInferenceConfigured, json } from "@/lib/server/providers";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => json({
        ok: true,
        time: new Date().toISOString(),
        providers: {
          text: isInferenceConfigured() ? "open-model" : "demo-parser",
          video: isInferenceConfigured() ? "open-model" : "not_configured",
          url_metadata: "open-graph",
        },
        limits: { upload_mb: 50, text_chars: 20000 },
      }),
    },
  },
});
