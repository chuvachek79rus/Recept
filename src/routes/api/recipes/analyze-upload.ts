import { createFileRoute } from "@tanstack/react-router";
import { getVideoProvider, json } from "@/lib/server/providers";
import type { ImportResponse } from "@/lib/recipes/types";

const MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED = ["video/mp4", "video/quicktime", "video/webm", "video/x-matroska", "video/3gpp"];

export const Route = createFileRoute("/api/recipes/analyze-upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const len = Number(request.headers.get("content-length") ?? 0);
        if (len > MAX_BYTES + 1024 * 64) return json({ status: "error", message: "Файл больше 50 МБ" } satisfies ImportResponse, 413);
        const provider = getVideoProvider();
        if (!provider) {
          return json({ status: "inference_not_configured", platform: "upload",
            message: "Сервис распознавания видео не подключён (демо-режим). Вставьте текст рецепта или субтитры — их можно обработать сразу." } satisfies ImportResponse);
        }
        let form: FormData;
        try { form = await request.formData(); } catch { return json({ status: "error", message: "Не удалось прочитать файл" } satisfies ImportResponse, 400); }
        const file = form.get("file");
        if (!(file instanceof File)) return json({ status: "error", message: "Файл не передан" } satisfies ImportResponse, 400);
        if (file.size > MAX_BYTES) return json({ status: "error", message: "Файл больше 50 МБ" } satisfies ImportResponse, 413);
        if (!ALLOWED.includes(file.type)) return json({ status: "error", message: "Поддерживаются MP4, MOV, WebM, MKV, 3GP" } satisfies ImportResponse, 415);
        const src = form.get("source_url");
        try {
          // File stays in request memory only; it is forwarded to the inference service and discarded.
          const result = await provider.analyze(file, typeof src === "string" ? src : null);
          return json({ status: "ok", platform: "upload", result, provider: provider.name, demo: false, message: "Видео обработано" } satisfies ImportResponse);
        } catch (e) {
          return json({ status: "error", message: e instanceof Error ? e.message : "Ошибка обработки видео" } satisfies ImportResponse, 502);
        }
      },
    },
  },
});
