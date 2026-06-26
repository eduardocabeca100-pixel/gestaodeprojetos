export function createNoPopupPrintWindow(title = "PDF") {
  let html = "";
  let alreadyPrinted = false;

  function printHtml() {
    if (alreadyPrinted || !html.trim() || typeof window === "undefined") return;

    alreadyPrinted = true;

    const frameId = "viva-hidden-print-frame";
    const oldFrame = window.document.getElementById(frameId);
    oldFrame?.remove();

    const iframe = window.document.createElement("iframe");
    iframe.id = frameId;
    iframe.title = title;
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";

    window.document.body.appendChild(iframe);

    const frameWindow = iframe.contentWindow;
    const frameDocument = frameWindow?.document;

    if (!frameWindow || !frameDocument) {
      window.alert("Não foi possível preparar o PDF.");
      iframe.remove();
      return;
    }

    frameDocument.open();
    frameDocument.write(html);
    frameDocument.close();

    window.setTimeout(() => {
      try {
        frameWindow.focus();
        frameWindow.print();
      } catch {
        window.alert("Não foi possível abrir a impressão do PDF.");
      }

      window.setTimeout(() => iframe.remove(), 1500);
    }, 450);
  }

  return {
    document: {
      open() {
        html = "";
      },
      write(value: string) {
        html += String(value ?? "");
      },
      close() {
        printHtml();
      },
    },
    focus() {},
    print() {
      printHtml();
    },
  } as unknown as Window;
}
