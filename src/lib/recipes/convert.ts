import { matchProduct } from "./products";
import { uid, type AnalysisResult, type Platform, type Recipe } from "./types";

export function analysisToRecipe(r: AnalysisResult, platform: Platform, demo: boolean): Recipe {
  return {
    id: uid(),
    title: r.title, description: r.description, category: r.category,
    servings: r.servings, prep_time_minutes: r.prep_time_minutes, cook_time_minutes: r.cook_time_minutes,
    ingredients: r.ingredients.map((i) => ({
      ...i, id: uid(),
      origin: i.is_estimated ? "estimated" : "extracted",
      productId: matchProduct(i.name),
    })),
    steps: r.steps.map((s) => ({ ...s, id: uid() })),
    source_url: r.source_url, platform,
    imported_at: new Date().toISOString(),
    transcript: r.transcript, image: null, favorite: false,
    warnings: r.warnings, demo_parsed: demo, confirmed_by_user: false,
  };
}
