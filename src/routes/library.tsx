import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, Heart, Import, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { RecipeCard } from "@/components/recipe-card";
import { useRecipes, useSettings } from "@/lib/recipes/storage";
import { CATEGORIES } from "@/lib/recipes/types";
import { cn } from "@/lib/utils";

type LibrarySearch = { category?: string };
export const Route = createFileRoute("/library")({
  validateSearch: (search: Record<string, unknown>): LibrarySearch => ({
    ...(typeof search["category"] === "string" ? { category: search["category"] } : {}),
  }),
  head: () => ({
    meta: [
      { title: "Библиотека рецептов — Рецепт в кармане" },
      { name: "description", content: "Поиск по вашей кулинарной книге, категории и избранные рецепты." },
      { property: "og:title", content: "Библиотека — Рецепт в кармане" },
      { property: "og:description", content: "Все ваши рецепты в одной удобной коллекции." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const recipes = useRecipes();
  const settings = useSettings();
  const { category: initialCategory } = Route.useSearch();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(initialCategory ?? "Все");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const categories = ["Все", ...CATEGORIES, ...settings.customCategories.filter((item) => !CATEGORIES.includes(item as typeof CATEGORIES[number]))];

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase("ru");
    return recipes.filter((recipe) => {
      const matchesQuery = !q || recipe.title.toLocaleLowerCase("ru").includes(q) || recipe.ingredients.some((ingredient) => ingredient.name.toLocaleLowerCase("ru").includes(q));
      return matchesQuery && (category === "Все" || recipe.category === category) && (!favoritesOnly || recipe.favorite);
    });
  }, [recipes, query, category, favoritesOnly]);

  return (
    <div>
      <PageHeader eyebrow="Ваша коллекция" title="Моя книга" description={`${recipes.length} рецептов сохранено на этом устройстве`} action={<Link to="/import" className="hidden min-h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground sm:inline-flex"><Import className="size-4" />Добавить</Link>} />

      <div className="sticky top-16 z-30 -mx-4 mb-5 bg-background/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6">
        <label className="relative block">
          <span className="sr-only">Поиск по рецептам и ингредиентам</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Название или ингредиент…" className="h-13 w-full rounded-full border border-input bg-card pl-12 pr-12 text-base outline-none ring-ring transition-shadow placeholder:text-muted-foreground focus:ring-2" />
          {query && <button type="button" onClick={() => setQuery("")} className="absolute right-1.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground" aria-label="Очистить поиск"><X className="size-4" /></button>}
        </label>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2" aria-label="Фильтры рецептов">
        <button type="button" onClick={() => setFavoritesOnly(!favoritesOnly)} className={cn("flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold", favoritesOnly ? "border-terracotta bg-accent text-accent-foreground" : "border-border bg-card")} aria-pressed={favoritesOnly}>
          <Heart className={cn("size-4", favoritesOnly && "fill-current")} aria-hidden /> Избранное
        </button>
        {categories.map((item) => (
          <button key={item} type="button" onClick={() => setCategory(item)} className={cn("min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium", category === item ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")} aria-pressed={category === item}>{item}</button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground"><span>{filtered.length} {filtered.length === 1 ? "рецепт" : "рецептов"}</span>{(query || category !== "Все" || favoritesOnly) && <button type="button" className="min-h-11 font-semibold text-primary" onClick={() => { setQuery(""); setCategory("Все"); setFavoritesOnly(false); }}>Сбросить фильтры</button>}</div>

      {filtered.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} />)}</div>
      ) : (
        <EmptyState icon={BookOpen} title={recipes.length ? "Ничего не найдено" : "Книга пока пуста"} description={recipes.length ? "Попробуйте изменить запрос или выбрать другую категорию." : "Добавьте рецепт по ссылке, из текста или видео."} action={recipes.length ? undefined : <Link to="/import" className="inline-flex min-h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground">Добавить рецепт</Link>} />
      )}
    </div>
  );
}
