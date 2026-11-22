import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getTextProvider, json, validatePublicUrl } from "@/lib/server/providers";
import { detectPlatform, type ImportResponse } from "@/lib/recipes/types";

const body = z.object({ url: z.string().min(8).max(2000) });

function decode(s: string) {
  return s.replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}
function meta(html: string, key: string) {
  const re = new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${key}["']`, "i");
  const m = html.match(re);
  return m ? decode(m[1] ?? m[2] ?? "").trim() : undefined;
}

async function fetchText(url: string, accept = "text/html") {
  const res = await fetch(url, {
    headers: { Accept: accept, "User-Agent": "Mozilla/5.0 (compatible; ReceptVKarmane/1.0; +metadata-only)" },
    redirect: "follow", signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return { ok: false as const, status: res.status };
  const reader = res.body?.getReader();
  let out = ""; const dec = new TextDecoder();
  while (reader) { const { done, value } = await reader.read(); if (done) break; out += dec.decode(value, { stream: true }); if (out.length > 1_000_000) { await reader.cancel(); break; } }
  return { ok: true as const, text: out };
}

export const Route = createFileRoute("/api/recipes/import-url")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = body.safeParse(await request.json().catch(() => null));
        const u = parsed.success ? validatePublicUrl(parsed.data.url) : null;
        if (!u) return json({ status: "error", message: "Некорректная или недопустимая ссылка" } satisfies ImportResponse, 400);
        const platform = detectPlatform(u.href);
        const needsUpload = (message: string, metadata?: ImportResponse["metadata"]): ImportResponse =>
          ({ status: "needs_upload", platform, metadata, message });

        try {
          let metadata: NonNullable<ImportResponse["metadata"]> = {};
          if (platform === "youtube") {
            const o = await fetchText(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(u.href)}`, "application/json");
            if (o.ok) { const d = JSON.parse(o.text); metadata = { title: d.title, author: d.author_name, image: d.thumbnail_url }; }
          }
          const page = await fetchText(u.href);
          if (page.ok) {
            metadata = {
              title: metadata.title ?? meta(page.text, "og:title") ?? page.text.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim(),
              description: meta(page.text, "og:description") ?? meta(page.text, "description"),
              image: metadata.image ?? meta(page.text, "og:image"),
              author: metadata.author,
            };
          }
          const desc = metadata.description ?? "";
          if (!page.ok && !metadata.title) {
            return json(needsUpload("Платформа не отдала публичные данные по ссылке (возможно, нужен вход или доступ ограничен). Загрузите видеофайл или вставьте текст/субтитры."));
          }
          if (desc.length < 60) {
            return json(needsUpload("По ссылке доступно только название — рецепта в описании нет. Сам ролик мы не скачиваем в обход ограничений платформы. Загрузите видео или вставьте текст.", metadata));
          }
          const provider = getTextProvider();
          const result = await provider.parse(desc, u.href, metadata.title?.slice(0, 120));
          result.warnings.unshift("Рецепт извлечён только из публичного описания ролика, не из самого видео.");
          return json({ status: "partial", platform, metadata, result, provider: provider.name, demo: provider.demo,
            message: "Найдено описание ролика — проверьте рецепт. Если в описании не всё, загрузите видео." } satisfies ImportResponse);
        } catch {
          return json(needsUpload("Не удалось получить данные по ссылке. Попробуйте загрузить видео или вставить текст."));
        }
      },
    },
  },
});
