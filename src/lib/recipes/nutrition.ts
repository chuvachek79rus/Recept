import { PRODUCT_BY_ID } from "./products";
import type { Ingredient } from "./types";

const UNIT_GRAMS: Record<string, number> = {
  "г": 1, "гр": 1, "кг": 1000, "мг": 0.001,
  "ст.л.": 15, "ч.л.": 5, "стакан": 200, "щепотка": 1,
};
const UNIT_ML: Record<string, number> = { "мл": 1, "л": 1000 };

export interface ResolvedMass { grams: number | null; estimated: boolean }

/** Mass of an ingredient in grams. Weight units are exact; volume/pieces are estimates. */
export function resolveGrams(ing: Pick<Ingredient, "amount" | "unit" | "grams" | "is_estimated" | "productId">): ResolvedMass {
  if (ing.grams != null) return { grams: ing.grams, estimated: ing.is_estimated };
  if (ing.amount == null) return { grams: null, estimated: true };
  const unit = ing.unit.trim().toLowerCase();
  const product = ing.productId ? PRODUCT_BY_ID.get(ing.productId) : undefined;
  if (unit in UNIT_GRAMS) {
    const exact = unit === "г" || unit === "гр" || unit === "кг" || unit === "мг";
    return { grams: ing.amount * UNIT_GRAMS[unit]!, estimated: !exact || ing.is_estimated };
  }
  if (unit in UNIT_ML) return { grams: ing.amount * UNIT_ML[unit]! * (product?.density ?? 1), estimated: true };
  if ((unit === "шт" || unit === "шт." || unit === "зубчик" || unit === "") && product?.piece)
    return { grams: ing.amount * product.piece, estimated: true };
  return { grams: null, estimated: true };
}

export interface NutritionTotals { kcal: number; p: number; f: number; c: number }
export interface NutritionReport {
  total: NutritionTotals;
  perServing: NutritionTotals;
  /** Ingredients with no product match or unknown mass — excluded from totals. */
  missing: string[];
  approximate: boolean;
  coverage: number;
}

export function computeNutrition(ingredients: Ingredient[], servings: number): NutritionReport {
  const total = { kcal: 0, p: 0, f: 0, c: 0 };
  const missing: string[] = [];
  let approximate = false;
  let counted = 0;
  for (const ing of ingredients) {
    const product = ing.productId ? PRODUCT_BY_ID.get(ing.productId) : undefined;
    const mass = resolveGrams(ing);
    if (!product || mass.grams == null) { missing.push(ing.name); continue; }
    counted++;
    if (mass.estimated) approximate = true;
    const k = mass.grams / 100;
    total.kcal += product.kcal * k; total.p += product.p * k;
    total.f += product.f * k; total.c += product.c * k;
  }
  if (missing.length) approximate = true;
  const s = Math.max(1, servings);
  return {
    total,
    perServing: { kcal: total.kcal / s, p: total.p / s, f: total.f / s, c: total.c / s },
    missing, approximate,
    coverage: ingredients.length ? counted / ingredients.length : 0,
  };
}

/** Scale ingredient amounts from base servings to target servings. */
export function scaleIngredients(ingredients: Ingredient[], from: number, to: number): Ingredient[] {
  const f = to / Math.max(1, from);
  return ingredients.map((i) => ({
    ...i,
    amount: i.amount == null ? null : round(i.amount * f),
    grams: i.grams == null ? null : round(i.grams * f),
  }));
}

export function round(n: number) {
  if (n >= 10) return Math.round(n);
  return Math.round(n * 10) / 10;
}
