import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Clock3, Heart, Import, Sparkles, UtensilsCrossed } from "lucide-react";
import syrniki from "@/assets/syrniki.jpg";
import { RecipeCard } from "@/components/recipe-card";
import { EmptyState } from "@/components/empty-state";
import { useRecipes } from "@/lib/recipes/storage";
import { CATEGORIES } from "@/lib/recipes/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Моя кулинарная книга — Рецепт в кармане" },
      { name: "description", content: "Главная кулинарной книги: любимые рецепты, быстрый импорт и список покупок." },
      { property: "og:title", content: "Рецепт в кармане — моя кулинарная книга" },
      { property: "og:description", content: "Сохраняйте любимые рецепты и готовьте с удовольствием." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const recipes = useRecipes();
  const recent = recipes.slice(0, 6);
  const favoriteCount = recipes.filter((recipe) => recipe.favorite).length;

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] bg-hero text-primary-foreground shadow-card">
        <div className="grid items-stretch md:grid-cols-[1.15fr_0.85fr]">
          <div className="relative z-10 p-6 py-9 sm:p-10 lg:p-12">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1.5 text-xs font-semibold tracking-wide">
              <Sparkles className="size-3.5" aria-hidden /> Готовить стало проще
            </span>
            <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl">
              Любимые рецепты. Всегда в кармане.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-6 text-primary-foreground/80 sm:text-base">
              Сохраняйте блюда из роликов и текста, пересчитывайте порции и собирайте покупки без лишних заметок.
            </p>
            <div className="mt-7 flex flex-col gap-3 min-[420px]:flex-row">
              <Link to="/import" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-terracotta px-6 text-sm font-bold text-terracotta-foreground shadow-lg transition-transform active:scale-[0.98]">
                <Import className="size-4" aria-hidden /> Добавить рецепт
              </Link>
              <Link to="/library" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-primary-foreground/25 px-6 text-sm font-semibold text-primary-foreground">
                Открыть книгу <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
          <div className="relative hidden min-h-[360px] md:block">
            <img src={syrniki} alt="Домашние сырники со сметаной и ягодами" className="absolute inset-0 size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/45 to-transparent" />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3" aria-label="Статистика кулинарной книги">
        {[
          { value: recipes.length, label: "рецептов", icon: BookOpen },
          { value: favoriteCount, label: "в избранном", icon: Heart },
          { value: recipes.reduce((sum, recipe) => sum + (recipe.cook_time_minutes ?? 0), 0), label: "минут готовки", icon: Clock3 },
        ].map(({ value, label, icon: Icon }) => (
          <div key={label} className="rounded-3xl border border-border/70 bg-card p-4 text-center sm:flex sm:items-center sm:justify-center sm:gap-3 sm:text-left">
            <Icon className="mx-auto size-5 text-terracotta sm:mx-0" aria-hidden />
            <div className="mt-2 sm:mt-0"><p className="text-xl font-bold sm:text-2xl">{value}</p><p className="text-[11px] text-muted-foreground sm:text-xs">{label}</p></div>
          </div>
        ))}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-terracotta">Ваша коллекция</p><h2 className="mt-1 text-2xl font-semibold sm:text-3xl">Недавно добавленные</h2></div>
          {recipes.length > 0 && <Link to="/library" className="min-h-11 py-3 text-sm font-semibold text-primary">Все рецепты →</Link>}
        </div>
        {recent.length ? (
          <div className="flex snap-x gap-4 overflow-x-auto pb-4 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
            {recent.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} compact />)}
          </div>
        ) : (
          <EmptyState icon={UtensilsCrossed} title="Здесь появятся ваши рецепты" description="Вставьте текст рецепта или ссылку на публичный ролик — всё остальное можно проверить перед сохранением." action={<Link to="/import" className="inline-flex min-h-11 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground">Добавить первый рецепт</Link>} />
        )}
      </section>

      <section className="pb-2">
        <h2 className="text-2xl font-semibold">Что приготовить?</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.filter((category) => category !== "Другое").map((category) => (
            <Link key={category} to="/library" search={{ category }} className="min-h-11 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-secondary">
              {category}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
