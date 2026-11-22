import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, FileVideo, Link2, LoaderCircle, Sparkles, TextCursorInput, Upload, WandSparkles } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/page-header";
import { analysisToRecipe } from "@/lib/recipes/convert";
import { saveDraft } from "@/lib/recipes/storage";
import type { ImportResponse, Platform } from "@/lib/recipes/types";
import { cn } from "@/lib/utils";

type ImportMode = "link" | "video" | "text";
type ImportSearch = { url?: string; text?: string; title?: string };

const EXAMPLE = `Домашние блины на молоке
Ингредиенты:
Мука — 200 г
Молоко — 500 мл
Яйцо — 2 шт
Сахар — 2 ст.л.
Масло растительное — 2 ст.л.
Соль — 1 щепотка
На 4 порции
Приготовление:
Смешайте яйца, сахар и соль до однородности.
Добавьте молоко и просеянную муку, тщательно перемешайте.
Влейте масло и оставьте тесто на 10 минут.
Жарьте блины на разогретой сковороде по 2 минуты с каждой стороны.`;

export const Route = createFileRoute("/import")({
  validateSearch: (search: Record<string, unknown>): ImportSearch => ({
    ...(typeof search["url"] === "string" ? { url: search["url"] } : {}),
    ...(typeof search["text"] === "string" ? { text: search["text"] } : {}),
    ...(typeof search["title"] === "string" ? { title: search["title"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Добавить рецепт — Рецепт в кармане" },
      { name: "description", content: "Импорт рецепта по ссылке, из видеофайла, текста или субтитров с проверкой результата." },
      { property: "og:title", content: "Добавить рецепт — Рецепт в кармане" },
      { property: "og:description", content: "Превратите ссылку, видео или текст в структурированный рецепт." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ImportPage,
});

const MODES: { id: ImportMode; label: string; icon: typeof Link2 }[] = [
  { id: "link", label: "Ссылка", icon: Link2 },
  { id: "video", label: "Видео", icon: FileVideo },
  { id: "text", label: "Текст", icon: TextCursorInput },
];

function ImportPage() {
  const shared = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<ImportMode>(shared.text ? "text" : "link");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: "error" | "info"; text: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (shared.url) { setUrl(shared.url); setMode("link"); }
    if (shared.text) { setText(shared.text); setMode("text"); }
    if (shared.title) setTitle(shared.title);
  }, [shared.url, shared.text, shared.title]);

  function openReview(response: ImportResponse, fallbackPlatform: Platform) {
    if (!response.result) return false;
    const recipe = analysisToRecipe(response.result, response.platform ?? fallbackPlatform, response.demo ?? false);
    if (response.metadata?.image) recipe.image = response.metadata.image;
    saveDraft(recipe);
    void navigate({ to: "/review" });
    return true;
  }

  async function submitLink(event: FormEvent) {
    event.preventDefault();
    if (!url.trim()) { setNotice({ type: "error", text: "Вставьте ссылку на ролик или страницу с рецептом." }); return; }
    setBusy(true); setNotice(null);
    try {
      const res = await fetch("/api/recipes/import-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
      const data = await res.json() as ImportResponse;
      if (!openReview(data, "web")) setNotice({ type: data.status === "error" ? "error" : "info", text: data.message });
    } catch { setNotice({ type: "error", text: "Не удалось связаться с сервером. Проверьте соединение или вставьте текст рецепта." }); }
    finally { setBusy(false); }
  }

  async function submitText(event: FormEvent) {
    event.preventDefault();
    if (text.trim().length < 10) { setNotice({ type: "error", text: "Добавьте текст рецепта или субтитры — минимум 10 символов." }); return; }
    setBusy(true); setNotice(null);
    try {
      const res = await fetch("/api/recipes/parse-text", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, title: title || undefined, source_url: url.trim() || null }) });
      const data = await res.json() as ImportResponse;
      if (!openReview(data, "text")) setNotice({ type: "error", text: data.message || "Не удалось разобрать текст." });
    } catch { setNotice({ type: "error", text: "Не удалось обработать текст. Попробуйте ещё раз." }); }
    finally { setBusy(false); }
  }

  async function submitVideo(event: FormEvent) {
    event.preventDefault();
    if (!file) { setNotice({ type: "error", text: "Сначала выберите видеофайл." }); return; }
    if (file.size > 50 * 1024 * 1024) { setNotice({ type: "error", text: "Файл больше 50 МБ. Выберите более короткое видео." }); return; }
    setBusy(true); setNotice(null);
    try {
      const form = new FormData(); form.append("file", file); if (url.trim()) form.append("source_url", url);
      const res = await fetch("/api/recipes/analyze-upload", { method: "POST", body: form });
      const data = await res.json() as ImportResponse;
      if (!openReview(data, "upload")) setNotice({ type: data.status === "error" ? "error" : "info", text: data.message });
    } catch { setNotice({ type: "error", text: "Не удалось отправить видео. Попробуйте ещё раз или используйте текст." }); }
    finally { setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="Новый рецепт" title="Что будем готовить?" description="Выберите удобный способ. Перед сохранением вы проверите каждый ингредиент и шаг." />

      <div className="grid grid-cols-3 rounded-2xl bg-muted p-1.5" role="tablist" aria-label="Способ добавления рецепта">
        {MODES.map(({ id, label, icon: Icon }) => (
          <button key={id} type="button" role="tab" aria-selected={mode === id} onClick={() => { setMode(id); setNotice(null); }} className={cn("flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 text-sm font-semibold transition-all", mode === id ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}>
            <Icon className="size-4" aria-hidden /><span>{label}</span>
          </button>
        ))}
      </div>

      <section className="mt-5 rounded-[1.75rem] border border-border/80 bg-card p-5 shadow-card sm:p-7">
        {mode === "link" && (
          <form onSubmit={submitLink}>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary"><Link2 className="size-6" aria-hidden /></div>
            <h2 className="mt-4 text-2xl font-semibold">Ссылка на ролик или страницу</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Instagram Reels, TikTok, YouTube Shorts, VK или кулинарный сайт. Мы читаем только публичное описание, не скачивая ролик.</p>
            <label className="mt-6 block text-sm font-semibold" htmlFor="recipe-url">Адрес страницы</label>
            <div className="relative mt-2"><Link2 className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden /><input id="recipe-url" type="url" inputMode="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.instagram.com/reel/…" className="h-14 w-full rounded-2xl border border-input bg-background pl-12 pr-4 text-base outline-none focus:ring-2 focus:ring-ring" /></div>
            <button disabled={busy} className="mt-5 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground disabled:opacity-60" type="submit">
              {busy ? <LoaderCircle className="size-5 animate-spin" /> : <WandSparkles className="size-5" />} {busy ? "Получаем описание…" : "Получить рецепт"}
            </button>
          </form>
        )}

        {mode === "video" && (
          <form onSubmit={submitVideo}>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary"><FileVideo className="size-6" aria-hidden /></div>
            <h2 className="mt-4 text-2xl font-semibold">Видео с вашего устройства</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">MP4, MOV, WebM, MKV или 3GP до 50 МБ. Файл передаётся только сервису распознавания, если он подключён.</p>
            <input ref={fileInput} type="file" accept="video/mp4,video/quicktime,video/webm,video/x-matroska,video/3gpp" className="sr-only" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setNotice(null); }} />
            <button type="button" onClick={() => fileInput.current?.click()} className="mt-6 flex min-h-44 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-input bg-background px-5 text-center transition-colors hover:bg-secondary/50">
              <Upload className="size-8 text-primary" strokeWidth={1.5} aria-hidden />
              <span className="mt-3 text-sm font-bold">{file ? file.name : "Выбрать видео"}</span>
              <span className="mt-1 text-xs text-muted-foreground">{file ? `${(file.size / 1024 / 1024).toFixed(1)} МБ` : "Нажмите, чтобы открыть файлы"}</span>
            </button>
            <button disabled={busy} className="mt-5 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground disabled:opacity-60" type="submit">
              {busy ? <LoaderCircle className="size-5 animate-spin" /> : <Sparkles className="size-5" />} {busy ? "Распознаём видео…" : "Распознать видео"}
            </button>
            <p className="mt-4 rounded-2xl bg-estimate/60 p-3 text-xs leading-5 text-estimate-foreground">Без внешнего сервиса с открытыми моделями анализ видео недоступен. Приложение честно сообщит об этом и не покажет выдуманный результат.</p>
          </form>
        )}

        {mode === "text" && (
          <form onSubmit={submitText}>
            <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary"><TextCursorInput className="size-6" aria-hidden /></div>
            <h2 className="mt-4 text-2xl font-semibold">Текст или субтитры</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Вставьте описание ролика, текст рецепта или субтитры. Встроенный демо-парсер работает без платных API.</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">Название <span className="font-normal text-muted-foreground">(необязательно)</span><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Например, Домашние блины" className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 text-base font-normal outline-none focus:ring-2 focus:ring-ring" /></label>
              <label className="text-sm font-semibold">Ссылка на источник <span className="font-normal text-muted-foreground">(необязательно)</span><input type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://…" className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 text-base font-normal outline-none focus:ring-2 focus:ring-ring" /></label>
            </div>
            <label className="mt-5 block text-sm font-semibold" htmlFor="recipe-text">Текст рецепта</label>
            <textarea id="recipe-text" value={text} onChange={(event) => setText(event.target.value)} placeholder={"Название блюда\nИнгредиенты:\nМука — 200 г\n…\nПриготовление:\nСмешайте…"} className="mt-2 min-h-64 w-full resize-y rounded-2xl border border-input bg-background p-4 text-base leading-7 outline-none focus:ring-2 focus:ring-ring" maxLength={20000} />
            <div className="mt-2 flex items-center justify-between gap-3 text-xs text-muted-foreground"><button type="button" className="min-h-11 font-semibold text-primary" onClick={() => setText(EXAMPLE)}>Вставить пример</button><span>{text.length} / 20 000</span></div>
            <button disabled={busy} className="mt-3 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground disabled:opacity-60" type="submit">
              {busy ? <LoaderCircle className="size-5 animate-spin" /> : <ArrowRight className="size-5" />} {busy ? "Разбираем текст…" : "Проверить рецепт"}
            </button>
          </form>
        )}
      </section>

      {notice && (
        <div role="status" className={cn("mt-4 flex items-start gap-3 rounded-2xl border p-4 text-sm leading-6", notice.type === "error" ? "border-destructive/30 bg-destructive/10 text-destructive" : "border-estimate bg-estimate/60 text-estimate-foreground")}>
          <AlertCircle className="mt-1 size-5 shrink-0" aria-hidden /><div><p>{notice.text}</p>{mode !== "text" && <button type="button" onClick={() => { setMode("text"); setNotice(null); }} className="mt-2 min-h-11 font-bold underline underline-offset-4">Перейти к вставке текста</button>}</div>
        </div>
      )}

      <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">Результат всегда можно исправить вручную. Рецепты хранятся только на этом устройстве.</p>
    </div>
  );
}
