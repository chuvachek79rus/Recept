import { Link } from "@tanstack/react-router";
import { ChefHat, Clock3, Heart, Users } from "lucide-react";
import type { Recipe } from "@/lib/recipes/types";
import { repo } from "@/lib/recipes/storage";
import { cn } from "@/lib/utils";

export function RecipeCard({ recipe, compact = false }: { recipe: Recipe; compact?: boolean }) {
  const totalTime = (recipe.prep_time_minutes ?? 0) + (recipe.cook_time_minutes ?? 0);
  return (
    <article className={cn("group relative overflow-hidden rounded-[1.4rem] border border-border/80 bg-card shadow-card", compact && "min-w-[260px] max-w-[280px] snap-start") }>
      <Link to="/recipe/$id" params={{ id: recipe.id }} className="block" aria-label={`Открыть рецепт «${recipe.title}»`}>
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          {recipe.image ? (
            <img src={recipe.image} alt="" className="size-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="flex size-full items-center justify-center bg-secondary text-primary/40">
              <ChefHat className="size-16" strokeWidth={1.2} aria-hidden />
            </div>
          )}
          <span className="absolute bottom-3 left-3 rounded-full bg-card/95 px-3 py-1 text-xs font-semibold text-card-foreground backdrop-blur-sm">{recipe.category}</span>
        </div>
        <div className="p-4">
          <h3 className="line-clamp-2 min-h-12 text-lg font-semibold leading-6">{recipe.title}</h3>
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            {totalTime > 0 && <span className="flex items-center gap-1.5"><Clock3 className="size-3.5" aria-hidden />{totalTime} мин</span>}
            <span className="flex items-center gap-1.5"><Users className="size-3.5" aria-hidden />{recipe.servings} пор.</span>
            {recipe.demo_parsed && <span className="ml-auto rounded-full bg-estimate px-2 py-0.5 text-[10px] font-semibold text-estimate-foreground">Демо</span>}
          </div>
        </div>
      </Link>
      <button
        type="button"
        className={cn("absolute right-3 top-3 flex size-11 items-center justify-center rounded-full bg-card/95 shadow-sm backdrop-blur-sm transition-transform active:scale-95", recipe.favorite ? "text-terracotta" : "text-muted-foreground")}
        aria-label={recipe.favorite ? "Убрать из избранного" : "Добавить в избранное"}
        onClick={() => repo.save({ ...recipe, favorite: !recipe.favorite })}
      >
        <Heart className={cn("size-5", recipe.favorite && "fill-current")} aria-hidden />
      </button>
    </article>
  );
}
