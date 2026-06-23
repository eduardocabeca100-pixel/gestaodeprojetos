import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[1.6rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(247,249,255,0.95))] p-[var(--viva-card-padding)] text-card-foreground soft-shadow",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(99,102,241,0.4),rgba(45,212,191,0.26),transparent)]" />
      {title || description || actions ? (
        <div className="relative mb-2.5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? <h2 className="text-[0.98rem] font-semibold">{title}</h2> : null}
            {description ? (
              <p className="mt-1 text-[0.86rem] leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
