/**
 * Local nutrition reference, values per 100 g (approximate, typical tables).
 * `keys` are lowercase stems matched against ingredient names.
 * `piece` = typical mass of one piece in grams (used only as an estimate).
 * `density` = g per ml for liquids (default 1).
 */
export interface Product {
  id: string; name: string; keys: string[];
  kcal: number; p: number; f: number; c: number;
  piece?: number; density?: number;
}

export const PRODUCTS: Product[] = [
  { id: "flour", name: "Мука пшеничная", keys: ["мук"], kcal: 334, p: 10.3, f: 1.1, c: 69.9 },
  { id: "sugar", name: "Сахар", keys: ["сахар"], kcal: 398, p: 0, f: 0, c: 99.7 },
  { id: "salt", name: "Соль", keys: ["соль", "соли"], kcal: 0, p: 0, f: 0, c: 0 },
  { id: "egg", name: "Яйцо куриное", keys: ["яйц", "яйко", "яиц"], kcal: 157, p: 12.7, f: 11.5, c: 0.7, piece: 55 },
  { id: "milk", name: "Молоко 2,5%", keys: ["молок"], kcal: 52, p: 2.8, f: 2.5, c: 4.7, density: 1.03 },
  { id: "kefir", name: "Кефир 2,5%", keys: ["кефир"], kcal: 53, p: 2.9, f: 2.5, c: 4, density: 1.03 },
  { id: "cottage", name: "Творог 5%", keys: ["творог", "творож"], kcal: 121, p: 17.2, f: 5, c: 1.8 },
  { id: "sourcream", name: "Сметана 20%", keys: ["сметан"], kcal: 206, p: 2.8, f: 20, c: 3.2 },
  { id: "butter", name: "Масло сливочное", keys: ["сливочн", "масло слив"], kcal: 748, p: 0.5, f: 82.5, c: 0.8 },
  { id: "oil", name: "Масло растительное", keys: ["растительн", "подсолнечн", "оливков", "масло"], kcal: 899, p: 0, f: 99.9, c: 0, density: 0.92 },
  { id: "cheese", name: "Сыр твёрдый", keys: ["сыр"], kcal: 360, p: 24, f: 29.5, c: 0 },
  { id: "feta", name: "Фета", keys: ["фет", "брынз"], kcal: 264, p: 14.2, f: 21.3, c: 4.1 },
  { id: "cream", name: "Сливки 20%", keys: ["сливк"], kcal: 205, p: 2.8, f: 20, c: 3.7 },
  { id: "chicken", name: "Куриное филе", keys: ["курин", "курица", "курицы", "филе кур", "грудк"], kcal: 113, p: 23.6, f: 1.9, c: 0.4 },
  { id: "beef", name: "Говядина", keys: ["говядин", "говяж"], kcal: 187, p: 18.9, f: 12.4, c: 0 },
  { id: "pork", name: "Свинина", keys: ["свинин", "свин"], kcal: 259, p: 16, f: 21.6, c: 0 },
  { id: "mince", name: "Фарш мясной", keys: ["фарш"], kcal: 254, p: 17, f: 20, c: 0 },
  { id: "salmon", name: "Лосось", keys: ["лосос", "сёмг", "семг", "форел"], kcal: 208, p: 20, f: 13, c: 0 },
  { id: "cod", name: "Треска", keys: ["треск", "минта", "хек"], kcal: 78, p: 17.7, f: 0.7, c: 0 },
  { id: "rice", name: "Рис (сухой)", keys: ["рис"], kcal: 344, p: 6.7, f: 0.7, c: 78.9 },
  { id: "buckwheat", name: "Гречка (сухая)", keys: ["гречк", "гречн"], kcal: 313, p: 12.6, f: 3.3, c: 62.1 },
  { id: "oats", name: "Овсяные хлопья", keys: ["овсян", "овёс", "овес"], kcal: 352, p: 12.3, f: 6.2, c: 61.8 },
  { id: "pasta", name: "Макароны (сухие)", keys: ["макарон", "паст", "спагетт"], kcal: 338, p: 10.4, f: 1.1, c: 71.5 },
  { id: "potato", name: "Картофель", keys: ["картоф", "картошк"], kcal: 77, p: 2, f: 0.4, c: 16.3, piece: 120 },
  { id: "carrot", name: "Морковь", keys: ["морков"], kcal: 35, p: 1.3, f: 0.1, c: 6.9, piece: 80 },
  { id: "onion", name: "Лук репчатый", keys: ["лук"], kcal: 41, p: 1.4, f: 0, c: 8.2, piece: 90 },
  { id: "garlic", name: "Чеснок", keys: ["чеснок", "чеснок", "зубчик"], kcal: 143, p: 6.5, f: 0.5, c: 29.9, piece: 5 },
  { id: "beet", name: "Свёкла", keys: ["свекл", "свёкл"], kcal: 42, p: 1.5, f: 0.1, c: 8.8, piece: 200 },
  { id: "cabbage", name: "Капуста белокочанная", keys: ["капуст"], kcal: 28, p: 1.8, f: 0.1, c: 4.7 },
  { id: "tomato", name: "Помидор", keys: ["помидор", "томат", "черри"], kcal: 20, p: 1.1, f: 0.2, c: 3.7, piece: 120 },
  { id: "tomatopaste", name: "Томатная паста", keys: ["томатн паст", "томатная паста"], kcal: 102, p: 4.8, f: 0, c: 19 },
  { id: "cucumber", name: "Огурец", keys: ["огур"], kcal: 15, p: 0.8, f: 0.1, c: 2.8, piece: 120 },
  { id: "pepper", name: "Перец болгарский", keys: ["болгарск", "перец слад", "паприк"], kcal: 26, p: 1.3, f: 0, c: 5.3, piece: 150 },
  { id: "zucchini", name: "Кабачок", keys: ["кабач", "цукин"], kcal: 24, p: 0.6, f: 0.3, c: 4.6, piece: 250 },
  { id: "olives", name: "Оливки", keys: ["оливк", "маслин"], kcal: 166, p: 1.8, f: 16.3, c: 5.2 },
  { id: "lemon", name: "Лимон", keys: ["лимон"], kcal: 34, p: 0.9, f: 0.1, c: 3, piece: 100 },
  { id: "apple", name: "Яблоко", keys: ["яблок"], kcal: 47, p: 0.4, f: 0.4, c: 9.8, piece: 170 },
  { id: "banana", name: "Банан", keys: ["банан"], kcal: 96, p: 1.5, f: 0.2, c: 21.8, piece: 120 },
  { id: "berries", name: "Ягоды (смесь)", keys: ["ягод", "клубник", "малин", "черник"], kcal: 45, p: 0.8, f: 0.4, c: 8.5 },
  { id: "honey", name: "Мёд", keys: ["мёд", "мед"], kcal: 329, p: 0.8, f: 0, c: 81.5 },
  { id: "cocoa", name: "Какао-порошок", keys: ["какао"], kcal: 289, p: 24.3, f: 15, c: 10.2 },
  { id: "chocolate", name: "Шоколад тёмный", keys: ["шоколад"], kcal: 539, p: 6.2, f: 35.4, c: 48.2 },
  { id: "mushroom", name: "Шампиньоны", keys: ["шампиньон", "гриб"], kcal: 27, p: 4.3, f: 1, c: 0.1 },
  { id: "greens", name: "Зелень (укроп, петрушка)", keys: ["укроп", "петрушк", "зелен", "базилик", "кинз"], kcal: 40, p: 2.5, f: 0.5, c: 6.3 },
  { id: "yogurt", name: "Йогурт натуральный", keys: ["йогурт"], kcal: 66, p: 5, f: 3.2, c: 3.5 },
  { id: "water", name: "Вода", keys: ["вод"], kcal: 0, p: 0, f: 0, c: 0 },
  { id: "bakingpowder", name: "Разрыхлитель", keys: ["разрыхлит", "сода"], kcal: 79, p: 0, f: 0, c: 37.8 },
  { id: "vanilla", name: "Ванильный сахар", keys: ["ванил"], kcal: 395, p: 0, f: 0, c: 98.7 },
  { id: "matcha", name: "Чай матча (порошок)", keys: ["матч"], kcal: 324, p: 30.6, f: 5.3, c: 38.5 },
  { id: "spices", name: "Специи (перец, лавровый лист)", keys: ["перец молот", "чёрный перец", "черный перец", "лавров", "специ"], kcal: 0, p: 0, f: 0, c: 0 },
];

export const PRODUCT_BY_ID = new Map(PRODUCTS.map((p) => [p.id, p]));

export function matchProduct(name: string): string | null {
  const n = name.toLowerCase().replace(/ё/g, "е");
  let best: { id: string; len: number } | null = null;
  for (const p of PRODUCTS) {
    for (const k of p.keys) {
      const key = k.replace(/ё/g, "е");
      if (n.includes(key) && (!best || key.length > best.len)) best = { id: p.id, len: key.length };
    }
  }
  return best?.id ?? null;
}
