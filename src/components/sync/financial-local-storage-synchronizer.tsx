"use client";

import { useEffect } from "react";

type Assignment = {
  paidAmount?: string;
  expectedAmount?: string;
};

function parseCurrency(value: string) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits) / 100;
}

function getPaidTotalsByProject() {
  const totals: Record<string, number> = {};

  try {
    const assignmentsRaw = window.localStorage.getItem("viva:project-team-assignments:v1");
    const assignmentsByProject = assignmentsRaw ? JSON.parse(assignmentsRaw) as Record<string, Assignment[]> : {};

    Object.entries(assignmentsByProject).forEach(([projectId, assignments]) => {
      totals[projectId] = Array.isArray(assignments)
        ? assignments.reduce((sum, assignment) => sum + parseCurrency(assignment.paidAmount ?? ""), 0)
        : 0;
    });
  } catch {
    return totals;
  }

  return totals;
}

function shouldLookLikeRefens(project: Record<string, unknown>) {
  const joined = Object.values(project)
    .filter((value) => typeof value === "string" || typeof value === "number")
    .join(" ")
    .toLowerCase();

  return joined.includes("reféns") || joined.includes("refens");
}

function syncObjectValue(project: Record<string, unknown>, paidTotal: number) {
  const executedKeys = [
    "executed",
    "executedValue",
    "executedAmount",
    "valorExecutado",
    "valor_executado",
    "paid",
    "paidAmount",
    "amountPaid",
  ];

  let changed = false;

  executedKeys.forEach((key) => {
    if (key in project) {
      project[key] = paidTotal;
      changed = true;
    }
  });

  return changed;
}

function syncFinancialValues() {
  if (typeof window === "undefined") return;

  const paidTotals = getPaidTotalsByProject();
  const allPaidTotal = Object.values(paidTotals).reduce((sum, value) => sum + value, 0);

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);
    if (!key) continue;

    const value = window.localStorage.getItem(key);
    if (!value) continue;

    try {
      const parsed = JSON.parse(value);
      let changed = false;

      if (Array.isArray(parsed)) {
        parsed.forEach((item) => {
          if (!item || typeof item !== "object") return;

          const project = item as Record<string, unknown>;
          if (!shouldLookLikeRefens(project)) return;

          const projectId = String(project.id ?? project.slug ?? "projeto-refens");
          const paidTotal = paidTotals[projectId] ?? paidTotals["projeto-refens"] ?? paidTotals["refens"] ?? allPaidTotal;

          changed = syncObjectValue(project, paidTotal) || changed;
        });
      }

      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const project = parsed as Record<string, unknown>;

        if (shouldLookLikeRefens(project)) {
          const projectId = String(project.id ?? project.slug ?? "projeto-refens");
          const paidTotal = paidTotals[projectId] ?? paidTotals["projeto-refens"] ?? paidTotals["refens"] ?? allPaidTotal;

          changed = syncObjectValue(project, paidTotal) || changed;
        }
      }

      if (changed) {
        window.localStorage.setItem(key, JSON.stringify(parsed));
      }
    } catch {
      // Ignora chaves que não são JSON.
    }
  }
}

export function FinancialLocalStorageSynchronizer() {
  useEffect(() => {
    syncFinancialValues();

    const interval = window.setInterval(syncFinancialValues, 2500);

    const onFocus = () => syncFinancialValues();
    const onVisibility = () => {
      if (!document.hidden) syncFinancialValues();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
