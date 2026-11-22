import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getTextProvider, json } from "@/lib/server/providers";
import type { ImportResponse } from "@/lib/recipes/types";

const body = z.object({
  text: z.string().trim().min(10, "Текст слишком короткий").max(20000, "Текст длиннее 20 000 символов"),
  source_url: z.string().url().max(2000).nullable().optional(),
  title: z.string().max(200).optional(),
});

export const Route = createFileRoute("/api/recipes/parse-text")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return json({ status: "error", message: parsed.error.issues[0]?.message ?? "Неверный запрос" } satisfies ImportResponse, 400);
        const provider = getTextProvider();
        const result = await provider.parse(parsed.data.text, parsed.data.source_url ?? null, parsed.data.title);
        return json({ status: "ok", message: "Рецепт распознан", result, provider: provider.name, demo: provider.demo } satisfies ImportResponse);
      },
    },
  },
});
