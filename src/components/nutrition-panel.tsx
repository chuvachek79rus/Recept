import { Info } from "lucide-react";
import type { NutritionReport } from "@/lib/recipes/nutrition";

export function NutritionPanel({ report }: { report: NutritionReport }) {
  const values = [
    { label: "Калории", value: Math.round(report.perServing.kcal), unit: "ккал" },
    { label: "Белки", value: report.perServing.p.toFixed(1), unit: "г" },
    { label: "Жиры", value: report.perServing.f.toFixed(1), unit: "г" },
    { label: "Углеводы", value: report.perServing.c.toFixed(1), unit: "г" },
  ];
  return (
    <section className="rounded-3xl bg-secondary/70 p-5" aria-labelledby="nutrition-title">
      <div className="flex items-center justify-between gap-3">
        <h2 id="nutrition-title" className="text-xl font-semibold">КБЖУ на порцию</h2>
        {report.approximate && <span className="rounded-full bg-estimate px-2.5 py-1 text-[11px] font-semibold text-estimate-foreground">Приблизительно</span>}
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2">
        {values.map((item) => (
          <div key={item.label} className="rounded-2xl bg-card p-3 text-center">
            <p className="text-lg font-bold leading-none sm:text-xl">{item.value}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{item.unit}</p>
            <p className="mt-2 text-[11px] font-medium">{item.label}</p>
          </div>
        ))}
      </div>
      {report.missing.length > 0 && (
        <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
          Нет данных или точного веса: {report.missing.join(", ")}. Эти позиции не учтены.
        </p>
      )}
    </section>
  );
}
