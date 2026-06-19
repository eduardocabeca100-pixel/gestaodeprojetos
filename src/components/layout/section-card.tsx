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
        "rounded-lg border border-border bg-card p-3.5 text-card-foreground soft-shadow sm:p-4",
        className,
      )}
    >
      {title || description || actions ? (
        <div className="mb-3 flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? <h2 className="text-[0.98rem] font-semibold">{title}</h2> : null}
            {description ? (
              <p className="mt-1 text-[0.9rem] leading-6 text-muted-foreground">
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
