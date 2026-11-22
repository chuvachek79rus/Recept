/**
 * Provider adapters. Swap implementations via env:
 *  - INFERENCE_URL (+ optional INFERENCE_TOKEN): self-hosted open-model service
 *    (e.g. faster-whisper + Qwen3-VL) exposing POST /analyze (multipart) and POST /parse-text (json).
 *  - Without it, the deterministic demo parser is used for text; video analysis reports "not configured".
 * Never log user content or secrets here.
 */
import { parseRecipeText } from "@/lib/recipes/parser";
import { analysisResultSchema, type AnalysisResult } from "@/lib/recipes/types";

export interface TextProvider { name: string; demo: boolean; parse(text: string, sourceUrl?: string | null, title?: string): Promise<AnalysisResult> }
export interface VideoProvider { name: string; analyze(file: File, sourceUrl?: string | null): Promise<AnalysisResult> }

function inferenceConfig() {
  const url = process.env['INFERENCE_URL'];
  return url ? { url: url.replace(/\/$/, ""), token: process.env['INFERENCE_TOKEN'] } : null;
}
function headers(token?: string): Record<string, string> { return token ? { Authorization: `Bearer ${token}` } : {}; }

export const demoTextProvider: TextProvider = {
  name: "demo-parser", demo: true,
  parse: async (text, sourceUrl, title) => parseRecipeText(text, { sourceUrl, titleHint: title }),
};

export function getTextProvider(): TextProvider {
  const cfg = inferenceConfig();
  if (!cfg) return demoTextProvider;
  return {
    name: "open-model", demo: false,
    async parse(text, sourceUrl, title) {
      try {
        const res = await fetch(`${cfg.url}/parse-text`, {
          method: "POST", headers: { "Content-Type": "application/json", ...headers(cfg.token) },
          body: JSON.stringify({ text, source_url: sourceUrl, title }), signal: AbortSignal.timeout(60000),
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        return analysisResultSchema.parse(await res.json());
      } catch {
        const r = await demoTextProvider.parse(text, sourceUrl, title);
        r.warnings.unshift("Сервис модели недоступен — использован демо-парсер.");
        return r;
      }
    },
  };
}

export function getVideoProvider(): VideoProvider | null {
  const cfg = inferenceConfig();
  if (!cfg) return null;
  return {
    name: "open-model",
    async analyze(file, sourceUrl) {
      const fd = new FormData();
      fd.append("file", file);
      if (sourceUrl) fd.append("source_url", sourceUrl);
      const res = await fetch(`${cfg.url}/analyze`, { method: "POST", headers: headers(cfg.token), body: fd, signal: AbortSignal.timeout(300000) });
      if (!res.ok) throw new Error(`Сервис анализа вернул ошибку ${res.status}`);
      return analysisResultSchema.parse(await res.json());
    },
  };
}

export function isInferenceConfigured() { return !!inferenceConfig(); }

/** Reject non-http(s) and private/loopback hosts (SSRF guard). */
export function validatePublicUrl(raw: string): URL | null {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return null; }
  if (u.protocol !== "https:" && u.protocol !== "http:") return null;
  const h = u.hostname.toLowerCase();
  if (h === "localhost" || h.endsWith(".local") || h.endsWith(".internal") || /^\[/.test(h)) return null;
  if (/^(10\.|127\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(h)) return null;
  if (!h.includes(".")) return null;
  return u;
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
