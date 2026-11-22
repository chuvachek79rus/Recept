/**
 * Deterministic demo parser: turns free text / subtitles into an AnalysisResult.
 * No model involved — every guess is flagged as estimated.
 */
import type { AnalysisResult } from "./types";

const UNITS: [RegExp, string][] = [
  [/^(кг|килограмм\w*)$/, "кг"], [/^(г|гр|грамм\w*)\.?$/, "г"],
  [/^(мл|миллилитр\w*)$/, "мл"], [/^(л|литр\w*)$/, "л"],
  [/^(ст\.?\s?л\.?|столов\w*)$/, "ст.л."], [/^(ч\.?\s?л\.?|чайн\w*)$/, "ч.л."],
  [/^(шт\.?|штук\w*)$/, "шт"], [/^(стакан\w*)$/, "стакан"],
  [/^(зубч\w*)$/, "зубчик"], [/^(щепотк\w*)$/, "щепотка"],
];
function normUnit(u: string): string | null {
  const s = u.toLowerCase().trim();
  for (const [re, v] of UNITS) if (re.test(s)) return v;
  return null;
}
const NUM = "(\\d+(?:[.,]\\d+)?(?:\\s*[-–]\\s*\\d+(?:[.,]\\d+)?)?|\\d+\\/\\d+|½|¼)";
const UNIT_RE = "(кг|г|гр|грамм\\w*|мл|л|литр\\w*|ст\\.?\\s?л\\.?|ч\\.?\\s?л\\.?|шт\\.?|штук\\w*|стакан\\w*|зубч\\w*|щепотк\\w*|столов\\w* ложк\\w*|чайн\\w* ложк\\w*)?";

function parseNum(s: string): number {
  if (s === "½") return 0.5;
  if (s === "¼") return 0.25;
  if (s.includes("/")) { const [a = 0, b = 0] = s.split("/").map(Number); return b ? a / b : a; }
  const range = s.split(/[-–]/).map((x) => parseFloat(x.replace(",", ".")));
  return range.length > 1 ? (range[0]! + range[1]!) / 2 : range[0]!;
}

type Ing = AnalysisResult["ingredients"][number];

export function parseIngredientLine(raw: string): Ing | null {
  const line = raw.replace(/^[\s•\-*–—·]+/, "").replace(/\s+/g, " ").trim();
  if (!line || line.length > 120) return null;
  const unitFix = (u?: string) => {
    if (!u) return "";
    const s = u.replace(/ ложк\w*/, "");
    if (/^столов/.test(s)) return "ст.л.";
    if (/^чайн/.test(s)) return "ч.л.";
    return normUnit(s) ?? "";
  };
  // "Мука — 200 г" / "Мука 200 г" / "Мука: 2 ст.л."
  let m = line.match(new RegExp(`^(.+?)[\\s:—–-]+${NUM}\\s*${UNIT_RE}\\s*(.*)$`, "i"));
  if (m && !/^\d/.test(m[1]!)) {
    const unit = unitFix(m[3]);
    return mk(cleanName(m[1]!), parseNum(m[2]!), unit, "high");
  }
  // "200 г муки" / "2 яйца"
  m = line.match(new RegExp(`^${NUM}\\s*${UNIT_RE}\\s+(.+)$`, "i"));
  if (m) return mk(cleanName(m[3]!), parseNum(m[1]!), unitFix(m[2]) || "шт", m[2] ? "high" : "medium");
  // "Соль по вкусу"
  m = line.match(/^(.+?)\s*[—–-]?\s*(по вкусу|щепотка|для жарки|для подачи)$/i);
  if (m) return { name: cleanName(m[1]!), amount: null, unit: m[2]!.toLowerCase(), grams: null, confidence: "medium", is_estimated: false };
  return null;
}
function cleanName(s: string) {
  const t = s.replace(/[:—–-]+$/, "").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}
function mk(name: string, amount: number, unit: string, confidence: Ing["confidence"]): Ing {
  const grams = unit === "г" ? amount : unit === "кг" ? amount * 1000 : null;
  return { name, amount, unit, grams, confidence, is_estimated: false };
}

const CATEGORY_HINTS: [string, RegExp][] = [
  ["Супы", /суп|борщ|щи\b|солянк|бульон|крем-суп/i],
  ["Салаты", /салат/i],
  ["Выпечка", /пирог|хлеб|булоч|печень|кекс|маффин|блин|оладь|пицц/i],
  ["Десерты", /десерт|торт|мусс|чизкейк|пудинг|морожен|тирамису/i],
  ["Напитки", /смузи|коктейл|напит|лимонад|латте|чай|компот/i],
  ["Завтраки", /завтрак|сырник|омлет|каш|яичниц|гранол|тост/i],
  ["Рыба", /рыб|лосос|сёмг|семг|треск|форел|тунец|кревет/i],
  ["Мясо", /мяс|говядин|свинин|куриц|курин|котлет|фарш|стейк|плов/i],
  ["Гарниры", /гарнир|пюре|рис\b|гречк|картофел/i],
];
export function guessCategory(text: string): string {
  for (const [c, re] of CATEGORY_HINTS) if (re.test(text)) return c;
  return "Другое";
}

const ING_HEAD = /^(?:ингредиенты|нам понадобится|понадобится|продукты|состав)(?=\s|$)/i;
const STEP_HEAD = /^(?:приготовление|способ приготовления|как готовить|шаги|рецепт|готовим)(?=\s|$)/i;

export function parseRecipeText(input: string, opts: { sourceUrl?: string | null | undefined; titleHint?: string | undefined } = {}): AnalysisResult {
  const text = input.replace(/\r/g, "").slice(0, 20000);
  // subtitle cleanup: timestamps, SRT counters
  const lines = text.split("\n")
    .map((l) => l.replace(/^\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d+)?\s*(-->\s*\S+)?/, "").trim())
    .filter((l) => l && !/^\d+$/.test(l) && !/^#\S+(\s+#\S+)*$/.test(l));
  const warnings: string[] = ["Результат получен демо-парсером без ИИ-модели — проверьте все поля."];

  let mode: "none" | "ing" | "steps" = "none";
  const ingredients: Ing[] = [];
  const stepLines: string[] = [];
  const other: string[] = [];
  for (const l of lines) {
    const clean = l.replace(/[:：]$/, "");
    if (ING_HEAD.test(clean)) { mode = "ing"; continue; }
    if (STEP_HEAD.test(clean)) { mode = "steps"; continue; }
    if (mode === "steps") { stepLines.push(l); continue; }
    // Servings are metadata, not an ingredient ("На 4 порции").
    if (/^(?:на\s+)?\d{1,2}\s*(?:порц|персон|человек)/i.test(l)) { other.push(l); continue; }
    const ing = parseIngredientLine(l);
    if (ing && (mode === "ing" || l.length < 60)) { ingredients.push(ing); continue; }
    if (mode === "ing" && l.length < 50 && !/[.!?]$/.test(l)) {
      ingredients.push({ name: cleanName(l.replace(/^[\s•\-*–—]+/, "")), amount: null, unit: "", grams: null, confidence: "low", is_estimated: true });
      continue;
    }
    other.push(l);
  }
  // title: hint, or first short non-ingredient line
  let title = opts.titleHint?.trim() || "";
  const firstOther = other[0];
  if (!title && firstOther && firstOther.length <= 80) title = other.shift()!.replace(/[.!]+$/, "");
  if (!title) { title = "Новый рецепт"; warnings.push("Название не найдено — укажите его вручную."); }

  const stepSource = stepLines.length ? stepLines : other.filter((l) => l.length > 25);
  const description = stepLines.length ? other.join(" ").slice(0, 400) : "";
  const steps = stepSource
    .flatMap((l) => (stepLines.length ? [l] : l.split(/(?<=[.!?])\s+(?=[А-ЯЁA-Z])/)))
    .map((l) => l.replace(/^(\d+[.)]|шаг\s*\d+[:.]?|[-•*])\s*/i, "").trim())
    .filter((l) => l.length > 3)
    .map((instruction) => {
      const t = instruction.match(/(\d{2,3})\s*(?:°|градус)/i);
      const d = instruction.match(/(\d+)(?:\s*[-–]\s*(\d+))?\s*(мин|час)/i);
      let dur: number | null = null;
      if (d) { const v = d[2] ? (Number(d[1]) + Number(d[2])) / 2 : Number(d[1]); dur = d[3]!.toLowerCase().startsWith("час") ? v * 60 : v; }
      return { instruction, duration_minutes: dur, temperature_c: t ? Number(t[1]) : null };
    });

  const sv = text.match(/(?:на|порци\w*:?)\s*(\d{1,2})\s*(?:порц|персон|человек)/i) || text.match(/(\d{1,2})\s*порц/i);
  const servings = sv ? Number(sv[1]) : 2;
  if (!sv) warnings.push("Количество порций не указано — по умолчанию 2 (оценка).");
  if (!ingredients.length) warnings.push("Ингредиенты не распознаны — добавьте их вручную.");
  if (!steps.length) warnings.push("Шаги приготовления не найдены.");
  const cook = steps.reduce((s, x) => s + (x.duration_minutes ?? 0), 0);

  return {
    title: title.slice(0, 200),
    description,
    category: guessCategory(title + " " + text.slice(0, 500)),
    servings: Math.min(Math.max(servings, 1), 50),
    prep_time_minutes: null,
    cook_time_minutes: cook || null,
    ingredients,
    steps,
    nutrition: null,
    source_url: opts.sourceUrl ?? null,
    transcript: text,
    warnings,
  };
}
