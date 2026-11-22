import { createFileRoute } from "@tanstack/react-router";
import { Download, HardDrive, Info, Plus, RotateCcw, Smartphone, Trash2, Upload, Video } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { exportBackup, importBackup, resetDemo, setSettings, useRecipes, useSettings } from "@/lib/recipes/storage";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Настройки и резервная копия — Рецепт в кармане" },
      { name: "description", content: "Настройки кулинарной книги, JSON экспорт и импорт, состояние распознавания видео." },
      { property: "og:title", content: "Настройки — Рецепт в кармане" },
      { property: "og:description", content: "Управление данными и установка приложения на Android." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

type Health = { providers?: { text?: string; video?: string } };

function SettingsPage() {
  const settings = useSettings();
  const recipes = useRecipes();
  const [category, setCategory] = useState("");
  const [health, setHealth] = useState<Health | null>(null);
  const importInput = useRef<HTMLInputElement>(null);

  useEffect(() => { fetch("/api/health").then((res) => res.json() as Promise<Health>).then(setHealth).catch(() => setHealth(null)); }, []);

  function downloadBackup() {
    const blob = new Blob([JSON.stringify(exportBackup(), null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob); const anchor = document.createElement("a");
    anchor.href = href; anchor.download = `recept-v-karmane-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(href);
    toast.success("Резервная копия скачана");
  }
  async function restore(file: File | undefined) {
    if (!file) return;
    if (!window.confirm("Заменить текущие рецепты и настройки данными из резервной копии?")) return;
    try { const count = importBackup(JSON.parse(await file.text())); toast.success(`Восстановлено рецептов: ${count}`); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Не удалось прочитать резервную копию"); }
    finally { if (importInput.current) importInput.current.value = ""; }
  }
  function addCategory(event: FormEvent) {
    event.preventDefault(); const value = category.trim(); if (!value) return;
    if (!settings.customCategories.includes(value)) setSettings({ customCategories: [...settings.customCategories, value] });
    setCategory("");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow="Под себя" title="Настройки" description="Данные, внешний вид списков и установка приложения." />

      <SettingsSection icon={HardDrive} title="Ваши данные" description={`${recipes.length} рецептов хранятся локально на этом устройстве. Без резервной копии очистка данных браузера удалит их.`}>
        <div className="grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={downloadBackup} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground"><Download className="size-4" />Скачать JSON</button>
          <button type="button" onClick={() => importInput.current?.click()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-input px-5 text-sm font-bold"><Upload className="size-4" />Восстановить JSON</button>
          <input ref={importInput} type="file" accept="application/json,.json" className="sr-only" onChange={(event) => void restore(event.target.files?.[0])} />
        </div>
      </SettingsSection>

      <SettingsSection title="Рецепты" description="Настройки применяются ко всей кулинарной книге.">
        <ToggleRow title="Показывать вес в граммах" description="Рядом с штуками, ложками и миллилитрами — если вес можно оценить." checked={settings.showGrams} onChange={(checked) => setSettings({ showGrams: checked })} />
        <ToggleRow title="Хранить исходный текст" description="Сохранять текст или субтитры вместе с новым рецептом." checked={settings.keepTranscripts} onChange={(checked) => setSettings({ keepTranscripts: checked })} />
      </SettingsSection>

      <SettingsSection title="Свои категории" description="Добавьте разделы, которых не хватает в вашей книге.">
        <form onSubmit={addCategory} className="flex gap-2"><input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Например, Заготовки" aria-label="Новая категория" className="h-12 min-w-0 flex-1 rounded-xl border border-input bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-ring" /><button type="submit" className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground" aria-label="Добавить категорию"><Plus className="size-5" /></button></form>
        {settings.customCategories.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{settings.customCategories.map((item) => <span key={item} className="inline-flex min-h-10 items-center gap-1 rounded-full bg-secondary pl-4 pr-1 text-sm">{item}<button type="button" onClick={() => setSettings({ customCategories: settings.customCategories.filter((current) => current !== item) })} className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:text-destructive" aria-label={`Удалить категорию ${item}`}><Trash2 className="size-3.5" /></button></span>)}</div>}
      </SettingsSection>

      <SettingsSection icon={Video} title="Распознавание" description="Текст можно разобрать локальным демо-парсером. Для анализа видео нужен ваш внешний сервис с открытыми моделями.">
        <div className="rounded-2xl bg-estimate/60 p-4 text-sm leading-6 text-estimate-foreground">
          <p className="font-bold">Видео: {health?.providers?.video === "open-model" ? "сервис подключён" : "сервис не подключён"}</p>
          <p className="mt-1">Текст: {health?.providers?.text === "open-model" ? "внешняя открытая модель" : "демо-парсер без ИИ"}. Никакие платные API или OpenAI не используются.</p>
        </div>
      </SettingsSection>

      <SettingsSection icon={Smartphone} title="Установить на Android" description="Опубликуйте приложение по HTTPS, откройте его в Chrome и выберите «Установить приложение» или «Добавить на главный экран». Меню «Поделиться» сможет передать ссылку и текст в приложение.">
        <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0" />Офлайн-режим не заявлен: для импорта по ссылке нужен интернет. Уже сохранённые рецепты доступны локально после загрузки страницы.</p>
      </SettingsSection>

      <section className="rounded-3xl border border-destructive/20 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-destructive">Начать заново</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Удалить ваши изменения и вернуть 10 демонстрационных рецептов. Список покупок также очистится.</p>
        <button type="button" onClick={() => { if (window.confirm("Удалить текущие данные и вернуть демо-рецепты? Сначала рекомендуем скачать JSON-копию.")) { resetDemo(); toast.success("Демо-данные восстановлены"); } }} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-destructive/30 px-4 text-sm font-bold text-destructive"><RotateCcw className="size-4" />Сбросить данные</button>
      </section>
      <p className="pb-3 text-center text-xs text-muted-foreground">Рецепт в кармане · отдельное независимое приложение</p>
    </div>
  );
}

function SettingsSection({ icon: Icon, title, description, children }: { icon?: typeof HardDrive; title: string; description: string; children: ReactNode }) {
  return <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6"><div className="flex items-start gap-3">{Icon && <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><Icon className="size-5" /></span>}<div><h2 className="text-xl font-semibold">{title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p></div></div><div className="mt-5">{children}</div></section>;
}
function ToggleRow({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return <div className="flex items-center justify-between gap-4 border-b border-border py-4 first:pt-0 last:border-0 last:pb-0"><div><h3 className="font-sans text-sm font-bold">{title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div><button type="button" role="switch" aria-checked={checked} aria-label={title} onClick={() => onChange(!checked)} className={cn("relative h-8 w-14 shrink-0 rounded-full transition-colors", checked ? "bg-primary" : "bg-input")}><span className={cn("absolute top-1 size-6 rounded-full bg-card shadow-sm transition-transform", checked ? "translate-x-7" : "translate-x-1")} /></button></div>;
}
