import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, ChefHat, Home, Import, Settings, ShoppingBasket } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Главная", icon: Home },
  { to: "/library", label: "Моя книга", icon: BookOpen },
  { to: "/import", label: "Добавить", icon: Import },
  { to: "/shopping", label: "Покупки", icon: ShoppingBasket },
  { to: "/settings", label: "Ещё", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => to === "/" ? pathname === "/" : pathname.startsWith(to);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex min-h-11 items-center gap-2.5" aria-label="Рецепт в кармане — на главную">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-card">
              <ChefHat className="size-5" aria-hidden />
            </span>
            <span>
              <span className="block font-display text-lg font-semibold leading-none">Рецепт в кармане</span>
              <span className="mt-1 hidden text-[11px] tracking-wide text-muted-foreground sm:block">Ваша умная кулинарная книга</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Основная навигация">
            {NAV.filter((item) => item.to !== "/import").map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  "rounded-full px-4 py-2.5 text-sm font-medium transition-colors",
                  isActive(to) ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {label}
              </Link>
            ))}
            <Link to="/import" className="ml-2 rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-terracotta-foreground transition-opacity hover:opacity-90">
              Добавить рецепт
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-safe pt-5 sm:px-6 sm:pt-8 md:pb-12">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden" aria-label="Навигация по приложению">
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = isActive(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn("flex min-h-[68px] flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium", active ? "text-primary" : "text-muted-foreground")}
                aria-current={active ? "page" : undefined}
              >
                <span className={cn("flex size-9 items-center justify-center rounded-full", active && "bg-secondary")}>
                  <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} aria-hidden />
                </span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
