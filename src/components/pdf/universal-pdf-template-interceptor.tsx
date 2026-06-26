"use client";

import { useEffect } from "react";

import {
  buildSystemPdfHtml,
  getPdfSettings,
} from "@/lib/pdf/pdf-template";

declare global {
  interface Window {
    __vivaPdfInterceptorApplied?: boolean;
    __vivaOriginalOpen?: typeof window.open;
    __vivaOriginalAnchorClick?: typeof HTMLAnchorElement.prototype.click;
  }
}

function isOfficialTemplate(html: string) {
  const lower = html.toLowerCase();

  return (
    lower.includes("data-viva-pdf-template") ||
    lower.includes("sistema de gestão de projetos • cia de artes viva") ||
    lower.includes("sistema de gestao de projetos • cia de artes viva") ||
    lower.includes("pdf-header") ||
    lower.includes("pdf-footer")
  );
}

function shouldWrapAsSystemPdf(html: string) {
  const lower = String(html ?? "").toLowerCase();

  if (!lower.trim()) return false;
  if (isOfficialTemplate(lower)) return false;

  return [
    "dossiê",
    "dossie",
    "dossiê completo",
    "dossie completo",
    "relatório",
    "relatorio",
    "orçamento",
    "orcamento",
    "documento oficial",
    "docs oficiais",
    "viva gestão cultural",
    "viva gestao cultural",
    "prestação de contas",
    "prestacao de contas",
    "cronograma",
    "reféns",
    "refens",
    "edital:",
    "inscrição:",
    "inscricao:",
    "valor aprovado",
    "status: classificado",
  ].some((token) => lower.includes(token));
}

function cleanLegacyHtml(html: string) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(
    html.includes("<html") || html.includes("<body")
      ? html
      : `<body>${html}</body>`,
    "text/html",
  );

  doc
    .querySelectorAll("script, style, link, meta, title, button, .print-actions, #__next")
    .forEach((node) => node.remove());

  const headings = Array.from(doc.querySelectorAll("h1, h2, h3"));

  const preferredHeading =
    headings.find((heading) =>
      /dossi|relat|orçamento|orcamento|documento|prestação|prestacao/i.test(
        heading.textContent ?? "",
      ),
    ) ?? headings[1] ?? headings[0];

  const title =
    preferredHeading?.textContent?.trim() ||
    "Documento gerado pelo sistema";

  headings.forEach((heading) => {
    const text = heading.textContent?.trim().toLowerCase() ?? "";

    if (
      text === "viva gestão cultural" ||
      text === "viva gestao cultural" ||
      text === "viva"
    ) {
      heading.remove();
    }
  });

  doc.querySelectorAll("*").forEach((element) => {
    element.removeAttribute("class");
    element.removeAttribute("style");
    element.removeAttribute("id");
  });

  const bodyHtml =
    doc.body.innerHTML.trim() ||
    "<p>Documento gerado automaticamente pelo sistema.</p>";

  return {
    title,
    bodyHtml,
  };
}

function wrapLegacyPdfHtml(html: string) {
  const { title, bodyHtml } = cleanLegacyHtml(html);

  return buildSystemPdfHtml(
    {
      title,
      subtitle: "Documento exportado pelo Sistema de Gestão.",



exportado pelo Sistema de Gestão de Projetos.",
      documentLabel: title,
      preparedBy: "Sistema",
      fileName: `${title.toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.pdf`,
      bodyHtml,
    },
    getPdfSettings(),
    true,
  );
}

function writeOfficialPdf(targetWindow: Window, html: string) {
  const wrappedHtml = wrapLegacyPdfHtml(html);

  targetWindow.document.open();
  targetWindow.document.write(wrappedHtml);
  targetWindow.document.close();

  setTimeout(() => {
    targetWindow.focus();
    targetWindow.print();
  }, 600);
}

async function tryOpenBlobAsOfficialPdf(
  originalOpen: typeof window.open,
  url: string,
  target?: string,
  features?: string,
) {
  const childWindow = originalOpen("", target || "_blank", features);

  if (!childWindow) return null;

  try {
    const response = await fetch(url);
    const text = await response.text();

    if (shouldWrapAsSystemPdf(text)) {
      writeOfficialPdf(childWindow, text);
    } else {
      childWindow.location.href = url;
    }
  } catch {
    childWindow.location.href = url;
  }

  return childWindow;
}

export function UniversalPdfTemplateInterceptor() {
  useEffect(() => {
    if (window.__vivaPdfInterceptorApplied) return;

    window.__vivaPdfInterceptorApplied = true;
    window.__vivaOriginalOpen = window.open;
    window.__vivaOriginalAnchorClick = HTMLAnchorElement.prototype.click;

    const originalOpen = window.open.bind(window);
    const originalAnchorClick = HTMLAnchorElement.prototype.click;

    window.open = ((...args: Parameters<typeof window.open>) => {
      const targetUrl = args[0];
      const target = args[1];
      const features = args[2];

      if (typeof targetUrl === "string" && targetUrl.startsWith("blob:")) {
        void tryOpenBlobAsOfficialPdf(originalOpen, targetUrl, target, features);
        return null;
      }

      const childWindow = originalOpen(...args);

      try {
        if (!childWindow) return childWindow;

        if (targetUrl && targetUrl !== "" && targetUrl !== "about:blank") {
          return childWindow;
        }

        const childDocument = childWindow.document as Document & {
          write: (...text: string[]) => void;
        };

        const originalWrite = childDocument.write.bind(childDocument);

        childDocument.write = (...contents: string[]) => {
          const html = contents.join("");

          if (shouldWrapAsSystemPdf(html)) {
            originalWrite(wrapLegacyPdfHtml(html));
            return;
          }

          originalWrite(...contents);
        };
      } catch {
        return childWindow;
      }

      return childWindow;
    }) as typeof window.open;

    HTMLAnchorElement.prototype.click = function patchedClick() {
      const href = this.href;

      if (href && href.startsWith("blob:")) {
        fetch(href)
          .then((response) => response.text())
          .then((text) => {
            if (shouldWrapAsSystemPdf(text)) {
              const childWindow = originalOpen("", this.target || "_blank");

              if (childWindow) {
                writeOfficialPdf(childWindow, text);
              }

              return;
            }

            originalAnchorClick.call(this);
          })
          .catch(() => {
            originalAnchorClick.call(this);
          });

        return;
      }

      originalAnchorClick.call(this);
    };

    return () => {
      if (window.__vivaOriginalOpen) {
        window.open = window.__vivaOriginalOpen;
      }

      if (window.__vivaOriginalAnchorClick) {
        HTMLAnchorElement.prototype.click = window.__vivaOriginalAnchorClick;
      }

      window.__vivaPdfInterceptorApplied = false;
    };
  }, []);

  return null;
}
