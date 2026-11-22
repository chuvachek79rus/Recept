import { describe, expect, it } from "vitest";
import { computeNutrition, scaleIngredients } from "@/lib/recipes/nutrition";
import { parseIngredientLine, parseRecipeText } from "@/lib/recipes/parser";
import type { Ingredient } from "@/lib/recipes/types";

const ingredient = (patch: Partial<Ingredient>): Ingredient => ({
  id: "1", name: "Яйцо", amount: 2, unit: "шт", grams: null,
  confidence: "high", is_estimated: false, origin: "extracted", productId: "egg", ...patch,
});

describe("Разбор текста рецепта", () => {
  it("читает русское количество и единицу измерения", () => {
    expect(parseIngredientLine("Мука — 200 г")).toMatchObject({ name: "Мука", amount: 200, unit: "г", grams: 200 });
    expect(parseIngredientLine("2 ст.л. сахара")).toMatchObject({ amount: 2, unit: "ст.л." });
  });

  it("собирает название, ингредиенты, шаги и число порций", () => {
    const result = parseRecipeText("Домашние блины\nИнгредиенты:\nМука — 200 г\nМолоко — 500 мл\nНа 4 порции\nПриготовление:\nСмешайте тесто.\nЖарьте 2 минуты.");
    expect(result.title).toBe("Домашние блины");
    expect(result.servings).toBe(4);
    expect(result.ingredients).toHaveLength(2);
    expect(result.steps).toHaveLength(2);
    expect(result.cook_time_minutes).toBe(2);
  });

  it("не смешивает разделы при разных русских заголовках", () => {
    const ingredientHeadings = ["Ингредиенты", "Продукты", "Состав", "Нам понадобится", "Понадобится"];
    const stepHeadings = ["Приготовление", "Способ приготовления", "Как готовить", "Шаги", "Готовим", "Рецепт"];
    for (const ingredientHeading of ingredientHeadings) {
      for (const stepHeading of stepHeadings) {
        for (const colon of ["", ":", "："]) {
          const label = `${ingredientHeading}${colon} / ${stepHeading}${colon}`;
          const result = parseRecipeText(`Блины\n${ingredientHeading}${colon}\nМука — 200 г\nНа 4 порции\n${stepHeading}${colon}\nСмешайте тесто.\nЖарьте 2 минуты.`);
          expect(result.ingredients.map((item) => item.name), label).toEqual(["Мука"]);
          expect(result.steps.map((item) => item.instruction), label).toEqual(["Смешайте тесто.", "Жарьте 2 минуты."]);
          expect(result.servings, label).toBe(4);
        }
      }
    }
  });
});

describe("Пересчёт и КБЖУ", () => {
  it("удваивает количество и граммы при удвоении порций", () => {
    const scaled = scaleIngredients([ingredient({ amount: 200, unit: "г", grams: 200 })], 2, 4);
    expect(scaled[0]?.amount).toBe(400);
    expect(scaled[0]?.grams).toBe(400);
  });

  it("оценивает вес двух яиц как 110 г и считает калории", () => {
    const report = computeNutrition([ingredient({})], 2);
    expect(report.total.kcal).toBeCloseTo(172.7);
    expect(report.perServing.kcal).toBeCloseTo(86.35);
    expect(report.approximate).toBe(true);
  });

  it("не выдумывает КБЖУ для неизвестного продукта", () => {
    const report = computeNutrition([ingredient({ name: "Неизвестный продукт", productId: null })], 1);
    expect(report.total.kcal).toBe(0);
    expect(report.missing).toEqual(["Неизвестный продукт"]);
    expect(report.approximate).toBe(true);
  });
});
