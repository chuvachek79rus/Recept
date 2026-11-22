import { ClientOnly, createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, Check, Clock3, Plus, Save, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { NutritionPanel } from "@/components/nutrition-panel";
import { PageHeader } from "@/components/page-header";
import { computeNutrition } from "@/lib/recipes/nutrition";
import { matchProduct } from "@/lib/recipes/products";
import { clearDraft, loadDraft, repo, useSettings } from "@/lib/recipes/storage";
import { CATEGORIES, uid, type Ingredient, type Recipe, type Step } from "@/lib/recipes/types";

export const Route = createFileRoute("/review")({
  head: () => ({
    meta: [
      { title: "Проверка рецепта — Рецепт в кармане" },
      { name: "description", content: "Проверьте и отредактируйте распознанные ингредиенты, шаги, порции и КБЖУ." },
      { property: "og:title", content: "Проверка рецепта — Рецепт в кармане" },
      { property: "og:description", content: "Исправьте детали перед сохранением в кулинарную книгу." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ReviewPage,
});

function ReviewPage() {
  return <ClientOnly fallback={<div className="py-20 text-center text-sm text-muted-foreground">Открываем черновик…</div>}><ReviewEditor /></ClientOnly>;
}

function ReviewEditor() {
  const [recipe, setRecipe] = useState<Recipe | null>(() => loadDraft());
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const settings = useSettings();
  const report = useMemo(() => recipe ? computeNutrition(recipe.ingredients, recipe.servings) : null, [recipe]);

  if (!recipe) {
    return <div className="mx-auto max-w-lg py-16 text-center"><h1 className="text-3xl font-semibold">Черновик не найден</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Сначала добавьте рецепт по ссылке, из видео или текста.</p><button onClick={() => void navigate({ to: "/import" })} className="mt-6 min-h-12 rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground">Добавить рецепт</button></div>;
  }

  const update = (patch: Partial<Recipe>) => setRecipe((current) => current ? { ...current, ...patch } : current);
  const updateIngredient = (id: string, patch: Partial<Ingredient>) => update({ ingredients: recipe.ingredients.map((item) => item.id === id ? { ...item, ...patch, origin: "user" } : item) });
  const updateStep = (id: string, patch: Partial<Step>) => update({ steps: recipe.steps.map((item) => item.id === id ? { ...item, ...patch } : item) });
  const numberOrNull = (value: string) => value === "" ? null : Number(value);

  function save() {
    if (!recipe) return;
    if (!recipe.title.trim()) { setError("Укажите название рецепта."); return; }
    if (!recipe.ingredients.length || recipe.ingredients.some((item) => !item.name.trim())) { setError("Добавьте хотя бы один ингредиент и заполните его название."); return; }
    if (!recipe.steps.length || recipe.steps.some((item) => !item.instruction.trim())) { setError("Добавьте хотя бы один шаг приготовления."); return; }
    const saved = { ...recipe, title: recipe.title.trim(), confirmed_by_user: true, transcript: settings.keepTranscripts ? recipe.transcript : null };
    repo.save(saved); clearDraft(); toast.success("Рецепт сохранён в вашей книге"); void navigate({ to: "/recipe/$id", params: { id: saved.id } });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <button type="button" onClick={() => history.back()} className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground"><ArrowLeft className="size-4" />Назад</button>
      <PageHeader eyebrow="Почти готово" title="Проверьте рецепт" description="Исправьте неточности — в книгу попадёт именно ваш вариант." action={<button type="button" onClick={save} className="hidden min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground sm:inline-flex"><Save className="size-4" />Сохранить</button>} />

      {recipe.demo_parsed && <div className="mb-5 flex items-start gap-3 rounded-2xl bg-estimate/70 p-4 text-sm leading-6 text-estimate-foreground"><AlertTriangle className="mt-1 size-5 shrink-0" /><p><strong>Демо-разбор без ИИ.</strong> Количества, категория и время могут быть неточными. Проверьте поля перед сохранением.</p></div>}
      {recipe.warnings.map((warning) => <p key={warning} className="mb-2 text-xs leading-5 text-muted-foreground">• {warning}</p>)}

      <div className="mt-6 space-y-5">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
          <h2 className="text-xl font-semibold">Основное</h2>
          <label className="mt-5 block text-sm font-semibold">Название<input value={recipe.title} onChange={(event) => update({ title: event.target.value })} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-4 text-base font-normal outline-none focus:ring-2 focus:ring-ring" /></label>
          <label className="mt-4 block text-sm font-semibold">Описание<textarea value={recipe.description} onChange={(event) => update({ description: event.target.value })} placeholder="Пара слов о блюде…" className="mt-2 min-h-24 w-full rounded-xl border border-input bg-background p-4 text-base font-normal outline-none focus:ring-2 focus:ring-ring" /></label>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <label className="col-span-2 text-sm font-semibold">Категория<select value={recipe.category} onChange={(event) => update({ category: event.target.value })} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-3 text-base font-normal outline-none focus:ring-2 focus:ring-ring">{[...CATEGORIES, ...settings.customCategories].filter((item, index, all) => all.indexOf(item) === index).map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="text-sm font-semibold">Порций<input type="number" min="1" max="50" value={recipe.servings} onChange={(event) => update({ servings: Math.max(1, Number(event.target.value) || 1) })} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-3 text-base font-normal outline-none focus:ring-2 focus:ring-ring" /></label>
            <label className="text-sm font-semibold">Подготовка, мин<input type="number" min="0" value={recipe.prep_time_minutes ?? ""} onChange={(event) => update({ prep_time_minutes: numberOrNull(event.target.value) })} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-3 text-base font-normal outline-none focus:ring-2 focus:ring-ring" /></label>
            <label className="col-span-2 text-sm font-semibold sm:col-span-2">Готовка, мин<input type="number" min="0" value={recipe.cook_time_minutes ?? ""} onChange={(event) => update({ cook_time_minutes: numberOrNull(event.target.value) })} className="mt-2 h-12 w-full rounded-xl border border-input bg-background px-3 text-base font-normal outline-none focus:ring-2 focus:ring-ring" /></label>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between gap-3"><div><h2 className="text-xl font-semibold">Ингредиенты</h2><p className="mt-1 text-xs text-muted-foreground">Название, количество и единица измерения</p></div><span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold">{recipe.ingredients.length}</span></div>
          <div className="mt-5 space-y-4">
            {recipe.ingredients.map((ingredient, index) => (
              <div key={ingredient.id} className="rounded-2xl bg-background p-3 ring-1 ring-border/70">
                <div className="flex items-center gap-2"><span className="w-6 text-center text-xs font-bold text-muted-foreground">{index + 1}</span><input aria-label={`Ингредиент ${index + 1}`} value={ingredient.name} onChange={(event) => updateIngredient(ingredient.id, { name: event.target.value, productId: matchProduct(event.target.value) })} className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /><button type="button" onClick={() => update({ ingredients: recipe.ingredients.filter((item) => item.id !== ingredient.id) })} className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Удалить ${ingredient.name}`}><Trash2 className="size-4" /></button></div>
                <div className="ml-8 mt-2 grid grid-cols-[1fr_1fr] gap-2"><input aria-label={`Количество: ${ingredient.name}`} type="number" inputMode="decimal" min="0" step="0.1" value={ingredient.amount ?? ""} onChange={(event) => { const amount = numberOrNull(event.target.value); updateIngredient(ingredient.id, { amount, grams: ingredient.unit === "г" ? amount : ingredient.unit === "кг" && amount != null ? amount * 1000 : null }); }} placeholder="Количество" className="h-11 min-w-0 rounded-lg border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /><input aria-label={`Единица измерения: ${ingredient.name}`} value={ingredient.unit} onChange={(event) => updateIngredient(ingredient.id, { unit: event.target.value })} placeholder="г, мл, шт…" className="h-11 min-w-0 rounded-lg border border-input bg-card px-3 text-sm outline-none focus:ring-2 focus:ring-ring" /></div>
                {ingredient.is_estimated && <p className="ml-8 mt-2 text-[11px] text-estimate-foreground">Оценка — проверьте количество</p>}
              </div>
            ))}
          </div>
          <button type="button" onClick={() => update({ ingredients: [...recipe.ingredients, { id: uid(), name: "", amount: null, unit: "г", grams: null, confidence: "high", is_estimated: false, origin: "user", productId: null }] })} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-input text-sm font-bold text-primary"><Plus className="size-4" />Добавить ингредиент</button>
        </section>

        {report && <NutritionPanel report={report} />}

        <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
          <h2 className="text-xl font-semibold">Приготовление</h2>
          <div className="mt-5 space-y-4">
            {recipe.steps.map((step, index) => (
              <div key={step.id} className="rounded-2xl bg-background p-4 ring-1 ring-border/70">
                <div className="flex items-center justify-between"><span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{index + 1}</span><button type="button" onClick={() => update({ steps: recipe.steps.filter((item) => item.id !== step.id) })} className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:text-destructive" aria-label={`Удалить шаг ${index + 1}`}><Trash2 className="size-4" /></button></div>
                <textarea aria-label={`Шаг ${index + 1}`} value={step.instruction} onChange={(event) => updateStep(step.id, { instruction: event.target.value })} className="mt-2 min-h-24 w-full resize-y rounded-xl border border-input bg-card p-3 text-sm leading-6 outline-none focus:ring-2 focus:ring-ring" />
                <div className="mt-2 grid grid-cols-2 gap-2"><label className="flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="size-4" /><input type="number" min="0" value={step.duration_minutes ?? ""} onChange={(event) => updateStep(step.id, { duration_minutes: numberOrNull(event.target.value) })} placeholder="Минут" aria-label={`Время шага ${index + 1}`} className="h-11 min-w-0 flex-1 rounded-lg border border-input bg-card px-3 outline-none" /></label><input type="number" value={step.temperature_c ?? ""} onChange={(event) => updateStep(step.id, { temperature_c: numberOrNull(event.target.value) })} placeholder="Температура °C" aria-label={`Температура шага ${index + 1}`} className="h-11 min-w-0 rounded-lg border border-input bg-card px-3 text-sm outline-none" /></div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => update({ steps: [...recipe.steps, { id: uid(), instruction: "", duration_minutes: null, temperature_c: null }] })} className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-input text-sm font-bold text-primary"><Plus className="size-4" />Добавить шаг</button>
        </section>
      </div>

      {error && <p role="alert" className="mt-5 rounded-2xl bg-destructive/10 p-4 text-sm font-semibold text-destructive">{error}</p>}
      <button type="button" onClick={save} className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-bold text-primary-foreground shadow-card"><Check className="size-5" />Сохранить в мою книгу</button>
      <p className="mt-3 text-center text-xs text-muted-foreground">После сохранения рецепт можно редактировать снова.</p>
    </div>
  );
}
