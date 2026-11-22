import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-input bg-card/60 px-6 py-12 text-center">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-secondary text-primary">
        <Icon className="size-7" strokeWidth={1.6} aria-hidden />
      </span>
      <h2 className="mt-5 text-2xl font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
