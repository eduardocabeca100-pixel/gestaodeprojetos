"use client";

import { useEffect } from "react";

function normalizeText(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function clearFieldValues(container: HTMLElement) {
  const fields = container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    "input, textarea, select",
  );

  fields.forEach((field) => {
    if (field instanceof HTMLSelectElement) {
      field.selectedIndex = 0;
    } else {
      field.value = "";
    }

    field.dispatchEvent(new Event("input", { bubbles: true }));
    field.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

function findFieldWrapper(element: HTMLElement) {
  let current: HTMLElement | null = element;

  for (let index = 0; current && index < 6; index += 1) {
    const fieldCount = current.querySelectorAll("input, textarea, select").length;
    const text = normalizeText(current.textContent || "");

    if (fieldCount >= 1 && fieldCount <= 2 && text.length < 220) {
      return current;
    }

    current = current.parentElement;
  }

  return element.parentElement || element;
}

function hideFinancialFields() {
  if (typeof window === "undefined") return;

  const pathname = window.location.pathname;

  if (pathname !== "/equipe") return;

  const labelsToRemove = new Set([
    "rubrica",
    "valor previsto",
    "valor pago",
    "status de pagamento",
  ]);

  const visibleNodes = Array.from(
    document.querySelectorAll<HTMLElement>("label, span, p, div, strong"),
  );

  visibleNodes.forEach((node) => {
    const text = normalizeText(node.textContent || "");

    if (!labelsToRemove.has(text)) return;

    const wrapper = findFieldWrapper(node);

    clearFieldValues(wrapper);
    wrapper.style.display = "none";
    wrapper.setAttribute("data-viva-hidden-team-financial", "true");
  });

  const cardTextsToRemove = [
    "previsto:",
    "pago:",
    "aberto:",
    "valor previsto:",
    "valor pago:",
    "status de pagamento:",
  ];

  Array.from(document.querySelectorAll<HTMLElement>("p, span, div")).forEach((node) => {
    const text = normalizeText(node.textContent || "");

    if (!cardTextsToRemove.some((item) => text.includes(item))) return;

    const insideForm = Boolean(node.closest("form"));
    const hugeBlock = (node.textContent || "").length > 260;

    if (insideForm || hugeBlock) return;

    const wrapper = findFieldWrapper(node);
    wrapper.style.display = "none";
    wrapper.setAttribute("data-viva-hidden-team-financial-card", "true");
  });
}

export function TeamCastingFinancialFieldsCleanup() {
  useEffect(() => {
    hideFinancialFields();

    const observer = new MutationObserver(() => {
      hideFinancialFields();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    const interval = window.setInterval(hideFinancialFields, 800);

    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
