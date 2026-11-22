import syrniki from "@/assets/syrniki.jpg";
import borscht from "@/assets/borscht.jpg";
import salad from "@/assets/salad.jpg";
import salmon from "@/assets/salmon.jpg";
import { matchProduct } from "./products";
import type { Ingredient, Recipe, Step } from "./types";

let n = 0;
const id = () => `demo-${++n}`;
function i(name: string, amount: number | null, unit: string, est = false): Ingredient {
  const grams = unit === "г" && amount != null ? amount : unit === "кг" && amount != null ? amount * 1000 : null;
  return { id: id(), name, amount, unit, grams, confidence: est ? "medium" : "high", is_estimated: est, origin: est ? "estimated" : "extracted", productId: matchProduct(name) };
}
function s(instruction: string, duration_minutes: number | null = null, temperature_c: number | null = null): Step {
  return { id: id(), instruction, duration_minutes, temperature_c };
}
function r(p: Partial<Recipe> & Pick<Recipe, "title" | "category" | "ingredients" | "steps">, daysAgo: number): Recipe {
  return {
    id: id(), description: "", servings: 2, prep_time_minutes: 10, cook_time_minutes: 20,
    source_url: null, platform: "manual", transcript: null, image: null, favorite: false,
    warnings: [], demo_parsed: false, confirmed_by_user: true,
    imported_at: new Date(Date.UTC(2026, 10, 18) - daysAgo * 86400000).toISOString(),
    ...p,
  };
}

export function buildSeedRecipes(): Recipe[] {
  n = 0;
  return [
    r({ title: "Пышные сырники", category: "Завтраки", image: syrniki, favorite: true, servings: 3, prep_time_minutes: 10, cook_time_minutes: 15,
      description: "Нежные сырники из творога с хрустящей корочкой. Демо-пример.", platform: "instagram",
      ingredients: [i("Творог 5%", 400, "г"), i("Яйцо", 1, "шт"), i("Мука", 3, "ст.л."), i("Сахар", 2, "ст.л."), i("Соль", null, "щепотка"), i("Масло растительное", 2, "ст.л.", true), i("Сметана для подачи", 100, "г")],
      steps: [s("Разомните творог вилкой, добавьте яйцо, сахар и соль."), s("Всыпьте муку и замесите мягкое тесто.", 2), s("Сформируйте сырники и обваляйте в муке."), s("Обжарьте на среднем огне до золотистой корочки с двух сторон.", 8), s("Подавайте со сметаной и ягодами.")] }, 1),
    r({ title: "Классический борщ", category: "Супы", image: borscht, servings: 6, prep_time_minutes: 25, cook_time_minutes: 90,
      description: "Наваристый борщ на говяжьем бульоне.", platform: "youtube",
      ingredients: [i("Говядина на кости", 600, "г"), i("Свёкла", 2, "шт", true), i("Картофель", 3, "шт", true), i("Капуста белокочанная", 300, "г"), i("Морковь", 1, "шт", true), i("Лук", 1, "шт", true), i("Томатная паста", 2, "ст.л."), i("Чеснок", 2, "зубчик"), i("Лавровый лист", null, "по вкусу"), i("Вода", 2.5, "л")],
      steps: [s("Залейте мясо водой и варите бульон, снимая пену.", 60), s("Свёклу натрите и потушите с томатной пастой.", 10), s("Обжарьте лук и морковь.", 7), s("Добавьте в бульон картофель, через 10 минут — капусту.", 15), s("Положите зажарку и свёклу, доведите до кипения, добавьте чеснок.", 5), s("Дайте настояться под крышкой 20 минут.", 20)] }, 2),
    r({ title: "Греческий салат", category: "Салаты", image: salad, favorite: true, servings: 2, prep_time_minutes: 10, cook_time_minutes: null,
      description: "Свежий салат с фетой и оливками за 10 минут.", platform: "tiktok",
      ingredients: [i("Помидоры", 300, "г"), i("Огурец", 200, "г"), i("Фета", 120, "г"), i("Оливки", 60, "г"), i("Лук красный", 0.5, "шт", true), i("Оливковое масло", 2, "ст.л."), i("Орегано", null, "по вкусу")],
      steps: [s("Нарежьте овощи крупными кусочками."), s("Добавьте оливки и тонкие кольца лука."), s("Выложите сверху фету, полейте маслом и посыпьте орегано.")] }, 3),
    r({ title: "Лосось с овощами в духовке", category: "Рыба", image: salmon, servings: 4, prep_time_minutes: 15, cook_time_minutes: 25,
      description: "Ужин на одном противне.", platform: "instagram",
      ingredients: [i("Филе лосося", 600, "г"), i("Картофель молодой", 500, "г"), i("Кабачок", 1, "шт", true), i("Помидоры черри", 200, "г"), i("Лимон", 1, "шт"), i("Оливковое масло", 3, "ст.л."), i("Розмарин", null, "по вкусу")],
      steps: [s("Разогрейте духовку до 200 °C.", null, 200), s("Картофель разрежьте пополам, полейте маслом и запекайте 15 минут.", 15, 200), s("Добавьте лосось, кабачок, черри и дольки лимона.", 5), s("Запекайте ещё 12–15 минут.", 13, 200)] }, 4),
    r({ title: "Курица терияки с рисом", category: "Мясо", servings: 3, prep_time_minutes: 10, cook_time_minutes: 25,
      ingredients: [i("Куриное филе", 500, "г"), i("Рис", 200, "г"), i("Соевый соус", 4, "ст.л."), i("Мёд", 1, "ст.л."), i("Чеснок", 2, "зубчик"), i("Кунжут", 1, "ч.л.")],
      steps: [s("Отварите рис.", 18), s("Нарежьте курицу и обжарьте до румяности.", 7), s("Добавьте соевый соус, мёд и чеснок, уваривайте до густоты.", 4), s("Подавайте с рисом, посыпав кунжутом.")] }, 5),
    r({ title: "Гречка по-купечески", category: "Гарниры", servings: 4, cook_time_minutes: 35,
      ingredients: [i("Гречка", 250, "г"), i("Свиной фарш", 300, "г"), i("Лук", 1, "шт", true), i("Морковь", 1, "шт", true), i("Томатная паста", 1, "ст.л."), i("Вода", 500, "мл")],
      steps: [s("Обжарьте лук и морковь, добавьте фарш.", 10), s("Всыпьте гречку, добавьте томатную пасту и воду.", 2), s("Тушите под крышкой на слабом огне.", 20)] }, 6),
    r({ title: "Банановый хлеб", category: "Выпечка", servings: 8, prep_time_minutes: 15, cook_time_minutes: 50, platform: "youtube",
      ingredients: [i("Бананы спелые", 3, "шт"), i("Мука", 220, "г"), i("Сахар", 100, "г"), i("Яйцо", 2, "шт"), i("Сливочное масло", 80, "г"), i("Разрыхлитель", 1, "ч.л.")],
      steps: [s("Разогрейте духовку до 180 °C.", null, 180), s("Разомните бананы, смешайте с растопленным маслом, яйцами и сахаром."), s("Добавьте муку с разрыхлителем и перемешайте."), s("Выпекайте в форме до сухой шпажки.", 50, 180)] }, 7),
    r({ title: "Шоколадный мусс", category: "Десерты", servings: 4, prep_time_minutes: 20, cook_time_minutes: null,
      ingredients: [i("Тёмный шоколад", 150, "г"), i("Сливки 33%", 250, "мл"), i("Яйцо", 2, "шт"), i("Сахар", 30, "г")],
      steps: [s("Растопите шоколад на водяной бане.", 5), s("Взбейте сливки до мягких пиков."), s("Смешайте желтки с шоколадом, вмешайте сливки и взбитые белки с сахаром."), s("Охладите в холодильнике минимум 3 часа.", 180)] }, 8),
    r({ title: "Зелёный смузи", category: "Напитки", servings: 1, prep_time_minutes: 5, cook_time_minutes: null, platform: "tiktok",
      ingredients: [i("Банан", 1, "шт"), i("Шпинат", 40, "г"), i("Йогурт натуральный", 150, "г"), i("Мёд", 1, "ч.л.")],
      steps: [s("Сложите всё в блендер и взбейте до однородности.", 1)] }, 9),
    r({ title: "Овсянка с ягодами", category: "ПП", servings: 1, prep_time_minutes: 2, cook_time_minutes: 7,
      ingredients: [i("Овсяные хлопья", 50, "г"), i("Молоко", 200, "мл"), i("Ягоды", 80, "г"), i("Мёд", 1, "ч.л.")],
      steps: [s("Залейте хлопья молоком и варите на слабом огне.", 6), s("Добавьте ягоды и мёд.")] }, 10),
  ];
}
