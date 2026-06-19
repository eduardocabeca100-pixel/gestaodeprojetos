import type { ReactNode } from "react";

export function PageContainer({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  }) {
  return (
    <main className="content-safe flex w-full flex-1 flex-col gap-4 px-[var(--viva-page-padding-x)] py-[var(--viva-page-padding-y)] sm:px-5 lg:px-6">
      <div className="flex flex-col gap-2.5 border-b border-border pb-3.5 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h1 className="text-balance text-[1.6rem] font-semibold tracking-normal text-foreground">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-3xl text-[0.88rem] leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </main>
  );
}
