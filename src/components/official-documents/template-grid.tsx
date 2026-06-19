import { FileSignature } from "lucide-react";

import { officialDocumentTemplates } from "@/modules/official-documents/types";

const descriptions: Record<string, string> = {
  Ofício: "comunicações oficiais externas e internas",
  "Pauta de Reunião": "organizar reuniões da diretoria e conselho",
  "Ata de Reunião": "registrar presenças e deliberações",
  "Deliberação do Conselho": "decisões formais da instituição",
  "Documento para Assinatura": "documentos que exigem assinatura",
  "Autorização de Compra": "aprovação de compra por projeto",
  "Autorização de Imagem": "uso de imagem, voz e foto",
  "Autorização de Responsável": "menores de idade e participação",
  "Recibo de Prestador PF": "serviços sem emissão de nota",
  "Recibo de Ator/Artista": "pagamento de elenco pessoa física",
};

export function TemplateGrid() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
      {officialDocumentTemplates.map((template) => (
        <button
          key={template}
          type="button"
          className="rounded-lg border border-border bg-white p-3 text-left transition hover:border-primary hover:bg-primary/5"
        >
          <FileSignature className="mb-2 size-4 text-primary" />
          <p className="text-sm font-semibold">{template}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {descriptions[template] ?? "modelo oficial institucional"}
          </p>
        </button>
      ))}
    </div>
  );
}
