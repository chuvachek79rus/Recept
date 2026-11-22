import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Clipboard, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { setShopping, useShopping } from "@/lib/recipes/storage";
import { uid } from "@/lib/recipes/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/shopping")({
  head: () => ({
    meta: [
      { title: "Список покупок — Рецепт в кармане" },
      { name: "description", content: "Продукты из ваших рецептов в одном списке покупок." },
      { property: "og:title", content: "Список покупок — Рецепт в кармане" },
      { property: "og:description", content: "Соберите продукты из рецептов и отмечайте купленное." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ShoppingPage,
});

function ShoppingPage() {
  const items = useShopping();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState("шт");
  const active = useMemo(() => items.filter((item) => !item.checked), [items]);
  const checked = useMemo(() => items.filter((item) => item.checked), [items]);

  function addManual(event: FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;
    setShopping([...items, { id: uid(), name: name.trim(), amount: amount ? Number(amount) : null, unit, checked: false, recipes: [] }]);
    setName(""); setAmount("");
  }
  async function copyList() {
    const text = items.filter((item) => !item.checked).map((item) => `• ${item.name}${item.amount != null ? ` — ${item.amount} ${item.unit}` : ""}`).join("\n") || "Список покупок пуст";
    try { await navigator.clipboard.writeText(text); toast.success("Список скопирован"); } catch { toast.error("Не удалось скопировать список"); }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader eyebrow="В магазин" title="Список покупок" description={items.length ? `${active.length} осталось купить · ${checked.length} уже в корзине` : "Добавляйте продукты из любого рецепта или вручную"} action={items.length ? <button type="button" onClick={copyList} className="flex size-11 items-center justify-center rounded-full border border-input bg-card" aria-label="Скопировать список"><Clipboard className="size-5" /></button> : undefined} />

      <form onSubmit={addManual} className="mb-6 rounded-3xl border border-border bg-card p-4 shadow-card">
        <div className="grid grid-cols-[1fr_82px_76px] gap-2">
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Добавить продукт…" aria-label="Название продукта" className="h-12 min-w-0 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <input value={amount} onChange={(event) => setAmount(event.target.value)} type="number" inputMode="decimal" min="0" step="0.1" placeholder="Кол-во" aria-label="Количество" className="h-12 min-w-0 rounded-xl border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          <select value={unit} onChange={(event) => setUnit(event.target.value)} aria-label="Единица измерения" className="h-12 min-w-0 rounded-xl border border-input bg-background px-2 text-sm outline-none">{["шт", "г", "кг", "мл", "л", "уп"].map((item) => <option key={item}>{item}</option>)}</select>
        </div>
        <button type="submit" disabled={!name.trim()} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-secondary text-sm font-bold text-secondary-foreground disabled:opacity-50"><Plus className="size-4" />Добавить в список</button>
      </form>

      {!items.length ? <EmptyState icon={ShoppingBasket} title="Список пока пуст" description="Откройте рецепт, выберите нужное число порций и нажмите «В список покупок»." action={<Link to="/library" className="inline-flex min-h-11 items-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground">Выбрать рецепт</Link>} /> : (
        <div className="space-y-6">
          <ShoppingSection title="Нужно купить" items={active} allItems={items} />
          {checked.length > 0 && <ShoppingSection title="Куплено" items={checked} allItems={items} />}
          <div className="flex flex-wrap gap-4">
            {checked.length > 0 && <button type="button" onClick={() => setShopping(active)} className="min-h-11 text-sm font-semibold text-muted-foreground">Убрать купленное</button>}
            <button type="button" onClick={() => { if (window.confirm("Очистить весь список покупок?")) setShopping([]); }} className="min-h-11 text-sm font-semibold text-destructive">Очистить список</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ShoppingSection({ title, items, allItems }: { title: string; items: ReturnType<typeof useShopping>; allItems: ReturnType<typeof useShopping> }) {
  return <section><div className="mb-2 flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2><span className="text-xs text-muted-foreground">{items.length}</span></div><ul className="overflow-hidden rounded-3xl border border-border bg-card shadow-card">{items.map((item) => (
    <li key={item.id} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0">
      <button type="button" onClick={() => setShopping(allItems.map((current) => current.id === item.id ? { ...current, checked: !current.checked } : current))} className={cn("flex size-11 shrink-0 items-center justify-center rounded-full", item.checked ? "text-confirmed" : "text-muted-foreground")} aria-label={item.checked ? `Вернуть ${item.name} в список` : `Отметить ${item.name} купленным`}><span className={cn("flex size-6 items-center justify-center rounded-full border-2", item.checked ? "border-confirmed bg-confirmed text-primary-foreground" : "border-input")}>{item.checked && <Check className="size-4" />}</span></button>
      <div className="min-w-0 flex-1"><p className={cn("text-sm font-semibold", item.checked && "text-muted-foreground line-through")}>{item.name}</p>{item.recipes.length > 0 && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{item.recipes.join(", ")}</p>}</div>
      <span className="shrink-0 text-sm text-muted-foreground">{item.amount ?? ""} {item.amount != null ? item.unit : ""}</span>
      <button type="button" onClick={() => setShopping(allItems.filter((current) => current.id !== item.id))} className="flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:text-destructive" aria-label={`Удалить ${item.name}`}><Trash2 className="size-4" /></button>
    </li>
  ))}</ul></section>;
}
