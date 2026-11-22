import { useSyncExternalStore } from "react";
import { buildSeedRecipes } from "./seed";
import type { Recipe, ShoppingItem } from "./types";

/**
 * Storage abstraction. LocalRepository keeps data in localStorage (works offline, no account).
 * A future SupabaseRepository can implement the same interface.
 */
export interface RecipeRepository {
  list(): Recipe[];
  get(id: string): Recipe | undefined;
  save(recipe: Recipe): void;
  remove(id: string): void;
  replaceAll(recipes: Recipe[]): void;
}

export interface AppSettings {
  customCategories: string[];
  showGrams: boolean;
  keepTranscripts: boolean;
}
const DEFAULT_SETTINGS: AppSettings = { customCategories: [], showGrams: true, keepTranscripts: true };

const K = { recipes: "rvk.recipes.v1", shopping: "rvk.shopping.v1", settings: "rvk.settings.v1", seeded: "rvk.seeded.v1" };

type Listener = () => void;
const listeners = new Set<Listener>();
const cache: { recipes?: Recipe[]; shopping?: ShoppingItem[]; settings?: AppSettings } = {};
const EMPTY_R: Recipe[] = [];
const EMPTY_S: ShoppingItem[] = [];

function read<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function write(key: string, v: unknown) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { console.warn("Хранилище переполнено", e); }
}
function emit() { listeners.forEach((l) => l()); }
function subscribe(l: Listener) {
  listeners.add(l);
  const onStorage = () => { delete cache.recipes; delete cache.shopping; delete cache.settings; l(); };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(l); window.removeEventListener("storage", onStorage); };
}

function loadRecipes(): Recipe[] {
  if (cache.recipes) return cache.recipes;
  if (!localStorage.getItem(K.seeded)) { write(K.recipes, buildSeedRecipes()); localStorage.setItem(K.seeded, "1"); }
  cache.recipes = read<Recipe[]>(K.recipes, []);
  return cache.recipes;
}
function setRecipes(r: Recipe[]) { cache.recipes = r; write(K.recipes, r); emit(); }

export const localRepository: RecipeRepository = {
  list: loadRecipes,
  get: (id) => loadRecipes().find((r) => r.id === id),
  save: (recipe) => {
    const all = loadRecipes();
    const exists = all.some((r) => r.id === recipe.id);
    setRecipes(exists ? all.map((r) => (r.id === recipe.id ? recipe : r)) : [recipe, ...all]);
  },
  remove: (id) => setRecipes(loadRecipes().filter((r) => r.id !== id)),
  replaceAll: (r) => setRecipes(r),
};
export const repo: RecipeRepository = localRepository;

export function useRecipes(): Recipe[] {
  return useSyncExternalStore(subscribe, loadRecipes, () => EMPTY_R);
}
export function useRecipe(id: string) {
  const all = useRecipes();
  return all.find((r) => r.id === id);
}

function loadShopping() { return (cache.shopping ??= read<ShoppingItem[]>(K.shopping, [])); }
export function setShopping(items: ShoppingItem[]) { cache.shopping = items; write(K.shopping, items); emit(); }
export function useShopping() { return useSyncExternalStore(subscribe, loadShopping, () => EMPTY_S); }

function loadSettings() { return (cache.settings ??= { ...DEFAULT_SETTINGS, ...read<Partial<AppSettings>>(K.settings, {}) }); }
export function setSettings(patch: Partial<AppSettings>) { cache.settings = { ...loadSettings(), ...patch }; write(K.settings, cache.settings); emit(); }
export function useSettings() { return useSyncExternalStore(subscribe, loadSettings, () => DEFAULT_SETTINGS); }

export function resetDemo() { localStorage.removeItem(K.seeded); delete cache.recipes; setShopping([]); loadRecipes(); emit(); }

export function exportBackup() {
  return { app: "recept-v-karmane", version: 1, exported_at: new Date().toISOString(), recipes: loadRecipes(), shopping: loadShopping(), settings: loadSettings() };
}
export function importBackup(data: unknown): number {
  const d = data as { app?: string; recipes?: unknown };
  if (!d || d.app !== "recept-v-karmane" || !Array.isArray(d.recipes)) throw new Error("Файл не похож на резервную копию «Рецепт в кармане».");
  const recipes = (d.recipes as Recipe[]).filter((r) => r && typeof r.id === "string" && typeof r.title === "string" && Array.isArray(r.ingredients));
  setRecipes(recipes);
  const full = data as { shopping?: ShoppingItem[]; settings?: AppSettings };
  if (Array.isArray(full.shopping)) setShopping(full.shopping);
  if (full.settings) setSettings(full.settings);
  return recipes.length;
}

/** Draft passed from import screen to review screen. */
const DRAFT = "rvk.draft.v1";
export function saveDraft(r: Recipe) { sessionStorage.setItem(DRAFT, JSON.stringify(r)); }
export function loadDraft(): Recipe | null { try { const v = sessionStorage.getItem(DRAFT); return v ? JSON.parse(v) : null; } catch { return null; } }
export function clearDraft() { sessionStorage.removeItem(DRAFT); }

export function addToShopping(recipe: Recipe, servings: number) {
  const f = servings / Math.max(1, recipe.servings);
  const items = [...loadShopping()];
  for (const ing of recipe.ingredients) {
    const amount = ing.amount == null ? null : Math.round(ing.amount * f * 10) / 10;
    const ex = items.find((x) => x.name.toLowerCase() === ing.name.toLowerCase() && x.unit === ing.unit && !x.checked);
    if (ex) {
      ex.amount = ex.amount != null && amount != null ? Math.round((ex.amount + amount) * 10) / 10 : ex.amount ?? amount;
      if (!ex.recipes.includes(recipe.title)) ex.recipes = [...ex.recipes, recipe.title];
    } else items.push({ id: `${Date.now()}-${ing.id}`, name: ing.name, amount, unit: ing.unit, checked: false, recipes: [recipe.title] });
  }
  setShopping(items.map((x) => ({ ...x })));
}
