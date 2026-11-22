import { z } from "zod";

export const CATEGORIES = [
  "Завтраки", "Салаты", "Супы", "Мясо", "Рыба", "Гарниры",
  "Выпечка", "Десерты", "Напитки", "ПП", "Другое",
] as const;

export const confidenceSchema = z.enum(["high", "medium", "low"]);
/** Where a value came from: extracted from source text, guessed by model/parser, or confirmed by user. */
export const originSchema = z.enum(["extracted", "estimated", "user"]);

export const ingredientSchema = z.object({
  name: z.string().min(1).max(120),
  amount: z.number().nonnegative().nullable(),
  unit: z.string().max(20),
  grams: z.number().nonnegative().nullable(),
  confidence: confidenceSchema,
  is_estimated: z.boolean(),
});

export const stepSchema = z.object({
  instruction: z.string().min(1).max(2000),
  duration_minutes: z.number().nonnegative().nullable(),
  temperature_c: z.number().nullable(),
});

export const nutritionSchema = z.object({
  calories: z.number().nullable(),
  protein_g: z.number().nullable(),
  fat_g: z.number().nullable(),
  carbs_g: z.number().nullable(),
  basis: z.enum(["per_serving", "total"]),
  is_estimated: z.boolean(),
});

/** JSON schema of an analysis result returned by every provider. */
export const analysisResultSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  category: z.string().max(40),
  servings: z.number().int().positive().max(100),
  prep_time_minutes: z.number().nonnegative().nullable(),
  cook_time_minutes: z.number().nonnegative().nullable(),
  ingredients: z.array(ingredientSchema).max(100),
  steps: z.array(stepSchema).max(100),
  nutrition: nutritionSchema.nullable(),
  source_url: z.string().nullable(),
  transcript: z.string().nullable(),
  warnings: z.array(z.string()),
});
export type AnalysisResult = z.infer<typeof analysisResultSchema>;

export type Confidence = z.infer<typeof confidenceSchema>;
export type Origin = z.infer<typeof originSchema>;
export type Platform = "instagram" | "tiktok" | "youtube" | "vk" | "web" | "upload" | "text" | "manual";

export interface Ingredient extends z.infer<typeof ingredientSchema> {
  id: string;
  origin: Origin;
  /** Manual or auto mapping to the local product reference; null = no data. */
  productId: string | null;
}
export interface Step extends z.infer<typeof stepSchema> { id: string }

export interface Recipe {
  id: string;
  title: string;
  description: string;
  category: string;
  servings: number;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  ingredients: Ingredient[];
  steps: Step[];
  source_url: string | null;
  platform: Platform;
  imported_at: string;
  transcript: string | null;
  image: string | null;
  favorite: boolean;
  warnings: string[];
  /** Result came from deterministic demo parser, not a real model. */
  demo_parsed: boolean;
  confirmed_by_user: boolean;
}

export interface ShoppingItem {
  id: string;
  name: string;
  amount: number | null;
  unit: string;
  checked: boolean;
  recipes: string[];
}

export type ImportStatus = "ok" | "partial" | "needs_upload" | "inference_not_configured" | "error";

export interface ImportResponse {
  status: ImportStatus;
  message: string;
  platform?: Platform;
  metadata?: { title?: string | undefined; description?: string | undefined; image?: string | undefined; author?: string | undefined } | undefined;
  result?: AnalysisResult;
  provider?: string;
  demo?: boolean;
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function detectPlatform(url: string): Platform {
  const u = url.toLowerCase();
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("vk.com") || u.includes("vkvideo")) return "vk";
  return "web";
}

export const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube", vk: "VK",
  web: "Сайт", upload: "Видеофайл", text: "Текст", manual: "Вручную",
};
