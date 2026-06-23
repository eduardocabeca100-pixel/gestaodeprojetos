import type { ReactNode } from "react";

export function PageContainer({
  title,
  description,
  actions,
  headerless = false,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  headerless?: boolean;
  children: ReactNode;
}) {
  return (
    <main className="content-safe flex w-full flex-1 flex-col gap-4 px-[var(--viva-page-padding-x)] py-[var(--viva-page-padding-y)] sm:px-5 lg:px-6">
      {headerless ? null : (
        <div className="relative overflow-hidden rounded-[1.8rem] border border-white/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(244,247,255,0.96))] px-5 py-5 soft-shadow md:px-6">
          <div className="pointer-events-none absolute inset-y-0 right-0 w-64 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.16),transparent_58%)]" />
          <div className="relative flex flex-col gap-2.5 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <p className="text-[0.72rem] font-black uppercase tracking-[0.32em] text-primary/70">
                Viva Gestão Cultural
              </p>
              <h1 className="text-balance text-[1.8rem] font-semibold tracking-normal text-foreground">
                {title}
              </h1>
              {description ? (
                <p className="mt-1.5 max-w-3xl text-[0.9rem] leading-6 text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
          </div>
        </div>
      )}
      {children}
    </main>
  );
}
