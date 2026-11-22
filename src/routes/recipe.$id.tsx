import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, ChefHat, Clock3, ExternalLink, Heart, Minus, Pencil, Plus, Share2, ShoppingBasket, Trash2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { NutritionPanel } from "@/components/nutrition-panel";
import { computeNutrition, scaleIngredients } from "@/lib/recipes/nutrition";
import { addToShopping, repo, saveDraft, useRecipe, useSettings } from "@/lib/recipes/storage";
import { PLATFORM_LABEL } from "@/lib/recipes/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/recipe/$id")({
  head: () => ({
    meta: [
      { title: "Рецепт — Рецепт в кармане" },
      { name: "description", content: "Ингредиенты, пошаговое приготовление, пересчёт порций и приблизительный расчёт КБЖУ." },
      { property: "og:title", content: "Рецепт — Рецепт в кармане" },
      { property: "og:description", content: "Готовьте по сохранённому рецепту и добавляйте продукты в покупки." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RecipePage,
});

function RecipePage() {
  const { id } = Route.useParams();
  const recipe = useRecipe(id);
  const settings = useSettings();
  const navigate = useNavigate();
  const [servings, setServings] = useState(recipe?.servings ?? 2);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  useEffect(() => { if (recipe) setServings(recipe.servings); }, [recipe?.id, recipe?.servings]);
  const ingredients = useMemo(() => recipe ? scaleIngredients(recipe.ingredients, recipe.servings, servings) : [], [recipe, servings]);
  const report = useMemo(() => computeNutrition(ingredients, servings), [ingredients, servings]);

  if (!recipe) {
    return <div className="py-16 text-center"><ChefHat className="mx-auto size-12 text-muted-foreground" /><h1 className="mt-4 text-3xl font-semibold">Рецепт не найден</h1><p className="mt-2 text-sm text-muted-foreground">Возможно, он был удалён с этого устройства.</p><Link to="/library" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground">Открыть мою книгу</Link></div>;
  }

  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
  function toggleFavorite() { if (recipe) repo.save({ ...recipe, favorite: !recipe.favorite }); }
  function remove() {
    if (!recipe || !window.confirm(`Удалить рецепт «${recipe.title}»? Это действие нельзя отменить.`)) return;
    repo.remove(recipe.id); toast.success("Рецепт удалён"); void navigate({ to: "/library" });
  }
  async function share() {
    if (!recipe) return;
    try {
      if (navigator.share) await navigator.share({ title: recipe.title, text: `Рецепт «${recipe.title}»`, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); toast.success("Ссылка скопирована"); }
    } catch (error) { if (error instanceof Error && error.name !== "AbortError") toast.error("Не удалось поделиться"); }
  }

  return (
    <article className="mx-auto max-w-4xl">
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link to="/library" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground"><ArrowLeft className="size-4" />Моя книга</Link>
        <div className="flex gap-1">
          <button type="button" onClick={share} className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted" aria-label="Поделиться рецептом"><Share2 className="size-5" /></button>
          <button type="button" onClick={toggleFavorite} className={cn("flex size-11 items-center justify-center rounded-full hover:bg-muted", recipe.favorite ? "text-terracotta" : "text-muted-foreground")} aria-label={recipe.favorite ? "Убрать из избранного" : "В избранное"}><Heart className={cn("size-5", recipe.favorite && "fill-current")} /></button>
          <button type="button" onClick={remove} className="flex size-11 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Удалить рецепт"><Trash2 className="size-5" /></button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card shadow-card">
        <div className="relative aspect-[4/3] max-h-[480px] bg-secondary sm:aspect-[16/8]">
          {recipe.image ? <img src={recipe.image} alt={recipe.title} className="size-full object-cover" /> : <div className="flex size-full items-center justify-center text-primary/30"><ChefHat className="size-24" strokeWidth={1} /></div>}
          <span className="absolute left-4 top-4 rounded-full bg-card/95 px-3 py-1.5 text-xs font-bold text-card-foreground">{recipe.category}</span>
          {recipe.demo_parsed && <span className="absolute right-4 top-4 rounded-full bg-estimate px-3 py-1.5 text-xs font-bold text-estimate-foreground">Проверен после демо-разбора</span>}
        </div>
        <div className="p-5 sm:p-8">
          <h1 className="text-3xl font-semibold leading-tight sm:text-5xl">{recipe.title}</h1>
          {recipe.description && <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">{recipe.description}</p>}
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {totalTime > 0 && <span className="flex items-center gap-2"><Clock3 className="size-4 text-terracotta" />{totalTime} мин</span>}
            <span className="flex items-center gap-2"><Users className="size-4 text-terracotta" />{recipe.servings} порции</span>
            <span>{PLATFORM_LABEL[recipe.platform]}</span>
          </div>
          <div className="mt-6 flex flex-col gap-3 min-[440px]:flex-row">
            <button type="button" onClick={() => { addToShopping(recipe, servings); toast.success("Продукты добавлены в список покупок"); }} className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground"><ShoppingBasket className="size-5" />В список покупок</button>
            <button type="button" onClick={() => { saveDraft(recipe); void navigate({ to: "/review" }); }} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-input px-5 text-sm font-bold"><Pencil className="size-4" />Редактировать</button>
          </div>
          {recipe.source_url && <a href={recipe.source_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-primary underline underline-offset-4">Открыть источник <ExternalLink className="size-3.5" /></a>}
        </div>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
            <div className="flex items-center justify-between gap-3"><h2 className="text-2xl font-semibold">Ингредиенты</h2><span className="text-xs text-muted-foreground">{ingredients.length} поз.</span></div>
            <div className="mt-5 flex items-center justify-between rounded-2xl bg-secondary p-2">
              <button type="button" onClick={() => setServings(Math.max(1, servings - 1))} className="flex size-11 items-center justify-center rounded-full bg-card shadow-sm disabled:opacity-40" disabled={servings <= 1} aria-label="Уменьшить количество порций"><Minus className="size-4" /></button>
              <div className="text-center"><p className="text-2xl font-bold">{servings}</p><p className="text-[11px] text-muted-foreground">порций</p></div>
              <button type="button" onClick={() => setServings(Math.min(50, servings + 1))} className="flex size-11 items-center justify-center rounded-full bg-card shadow-sm" aria-label="Увеличить количество порций"><Plus className="size-4" /></button>
            </div>
            <ul className="mt-4 divide-y divide-border">
              {ingredients.map((ingredient) => (
                <li key={ingredient.id} className="flex items-baseline justify-between gap-4 py-3.5 text-sm">
                  <span className="min-w-0"><span className="block leading-5">{ingredient.name}</span>{ingredient.is_estimated && <span className="mt-1 block text-[10px] font-semibold text-estimate-foreground">оценочное количество</span>}</span>
                  <span className="shrink-0 text-right font-semibold">{ingredient.amount ?? "—"} {ingredient.unit}{settings.showGrams && ingredient.grams != null && ingredient.unit !== "г" && <span className="mt-0.5 block text-[10px] font-normal text-muted-foreground">≈ {ingredient.grams} г</span>}</span>
                </li>
              ))}
            </ul>
          </section>
          <NutritionPanel report={report} />
        </div>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-card sm:p-6">
          <h2 className="text-2xl font-semibold">Приготовление</h2>
          <p className="mt-1 text-xs text-muted-foreground">Нажимайте на шаг, чтобы отметить выполненный</p>
          <ol className="mt-6 space-y-5">
            {recipe.steps.map((step, index) => {
              const done = completed.has(step.id);
              return <li key={step.id}>
                <button type="button" onClick={() => setCompleted((current) => { const next = new Set(current); if (next.has(step.id)) next.delete(step.id); else next.add(step.id); return next; })} className="flex w-full items-start gap-3 text-left" aria-pressed={done}>
                  <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors", done ? "bg-confirmed text-primary-foreground" : "bg-secondary text-primary")}>{done ? <Check className="size-4" /> : index + 1}</span>
                  <span className="min-w-0 flex-1 pt-1"><span className={cn("block text-sm leading-6", done && "text-muted-foreground line-through")}>{step.instruction}</span><span className="mt-2 flex flex-wrap gap-2">{step.duration_minutes != null && <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">{step.duration_minutes} мин</span>}{step.temperature_c != null && <span className="rounded-full bg-accent px-2.5 py-1 text-[11px] text-accent-foreground">{step.temperature_c} °C</span>}</span></span>
                </button>
              </li>;
            })}
          </ol>
        </section>
      </div>

      {recipe.transcript && <details className="mt-6 rounded-2xl border border-border bg-card p-5"><summary className="cursor-pointer text-sm font-bold">Исходный текст</summary><pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap font-sans text-xs leading-6 text-muted-foreground">{recipe.transcript}</pre></details>}
    </article>
  );
}

