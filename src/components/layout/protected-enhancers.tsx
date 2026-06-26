"use client";

import dynamic from "next/dynamic";

const FinancialLocalStorageSynchronizer = dynamic(
  () =>
    import("@/components/sync/financial-local-storage-synchronizer").then(
      (mod) => mod.FinancialLocalStorageSynchronizer,
    ),
  { ssr: false },
);

export function ProtectedEnhancers() {
  return <FinancialLocalStorageSynchronizer />;
}
