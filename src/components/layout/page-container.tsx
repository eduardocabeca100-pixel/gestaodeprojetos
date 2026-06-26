import type { ReactNode } from "react";

type PageContainerProps = {
  title?: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  [key: string]: unknown;
};

export function PageContainer({
  title,
  description,
  eyebrow = "VIVA GESTÃO CULTURAL",
  actions,
  children,
  className = "",
  headerClassName = "",
}: PageContainerProps) {
  return (
    <main className={`w-full max-w-none space-y-6 px-4 py-6 sm:px-6 lg:px-8 ${className}`}>
      {title || description || actions ? (
        <section
          className={`w-full rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-sm backdrop-blur ${headerClassName}`}
        >
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              {eyebrow ? (
                <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">
                  {eyebrow}
                </p>
              ) : null}

              {title ? (
                <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">
                  {title}
                </h1>
              ) : null}

              {description ? (
                <p className="mt-2 max-w-5xl text-sm leading-6 text-slate-500">
                  {description}
                </p>
              ) : null}
            </div>

            {actions ? <div className="shrink-0">{actions}</div> : null}
          </div>
        </section>
      ) : null}

      <div className="w-full max-w-none">{children}</div>
    </main>
  );
}

export default PageContainer;
