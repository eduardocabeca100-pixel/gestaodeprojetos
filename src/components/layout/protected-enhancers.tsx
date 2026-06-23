"use client";

import dynamic from "next/dynamic";

const FinancialLocalStorageSynchronizer = dynamic(
  () =>
    import("@/components/sync/financial-local-storage-synchronizer").then(
      (mod) => mod.FinancialLocalStorageSynchronizer,
    ),
  { ssr: false },
);

const UniversalPdfTemplateInterceptor = dynamic(
  () =>
    import("@/components/pdf/universal-pdf-template-interceptor").then(
      (mod) => mod.UniversalPdfTemplateInterceptor,
    ),
  { ssr: false },
);

export function ProtectedEnhancers() {
  return (
    <>
      <FinancialLocalStorageSynchronizer />
      <UniversalPdfTemplateInterceptor />
    </>
  );
}
