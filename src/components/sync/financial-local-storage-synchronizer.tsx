"use client";

import { useEffect } from "react";

import {
  LOCAL_FINANCIAL_DATA_CHANGED_EVENT,
  syncAllProjectFinancialDrafts,
} from "@/lib/local-financial-sync";

export function FinancialLocalStorageSynchronizer() {
  useEffect(() => {
    let timeoutId: number | null = null;
    let idleId: number | null = null;

    const flushSync = () => {
      timeoutId = null;
      idleId = null;
      syncAllProjectFinancialDrafts();
    };

    const scheduleSync = () => {
      if (timeoutId !== null || idleId !== null) {
        return;
      }

      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(flushSync, { timeout: 900 });
        return;
      }

      timeoutId = window.setTimeout(flushSync, 180);
    };

    scheduleSync();

    const onFocus = () => scheduleSync();
    const onStorage = () => scheduleSync();
    const onFinancialChange = () => scheduleSync();
    const onVisibility = () => {
      if (!document.hidden) {
        scheduleSync();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    window.addEventListener(LOCAL_FINANCIAL_DATA_CHANGED_EVENT, onFinancialChange);
    window.addEventListener("viva:refens-costs-applied", onFinancialChange);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      if (idleId !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }

      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener(
        LOCAL_FINANCIAL_DATA_CHANGED_EVENT,
        onFinancialChange,
      );
      window.removeEventListener("viva:refens-costs-applied", onFinancialChange);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
