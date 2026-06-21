"use client";

import { useState } from "react";
import { Download, Eye, FileText, Save, Type } from "lucide-react";

import { SectionCard } from "@/components/layout/section-card";
import { Button } from "@/components/ui/button";
import { officialDocumentTemplates } from "@/modules/official-documents/types";

export function OfficialDocumentForm() {
  const [feedback, setFeedback] = useState("Documento pronto para edição.");
  const [activeTool, setActiveTool] = useState("Normal");

  return (
    <div className="grid min-w-0 gap-6 2xl:grid-cols-[minmax(320px,0.78fr)_minmax(0,1.22fr)]">
      <div className="space-y-4">
        <SectionCard title="Dados do arquivo">
          <div className="grid gap-3">
            <label className="block">
              <span className="text-sm font-medium">Modelo</span>
              <select className="form-input mt-1" defaultValue="Ofício">
                {officialDocumentTemplates.map((template) => (
                  <option key={template}>{template}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium">Nome do documento</span>
              <input className="form-input mt-1" placeholder="Ex.: Autorização de imagem - Reféns" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium">Número/código</span>
                <input className="form-input mt-1" defaultValue="OFC-0001/2026" />
              </label>
              <label className="block">
                <span className="text-sm font-medium">Data</span>
                <input className="form-input mt-1" type="date" defaultValue="2026-06-19" />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-medium">Assunto/tema</span>
              <input className="form-input mt-1" />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Status</span>
              <select className="form-input mt-1" defaultValue="Rascunho">
                <option>Rascunho</option>
                <option>Finalizado</option>
                <option>Assinado</option>
                <option>Arquivado</option>
              </select>
            </label>
          </div>
        </SectionCard>

        <SectionCard title="Destinatário e assinatura">
          <div className="grid gap-3">
            <input className="form-input" placeholder="Destinatário" />
            <input className="form-input" placeholder="Cargo" />
            <input className="form-input" placeholder="Instituição" />
            <input className="form-input" placeholder="Endereço" />
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="form-input" defaultValue="Marcel Eduardo Cabeça Domingues" placeholder="Assinante 1" />
              <input className="form-input" defaultValue="Diretor geral" placeholder="Cargo 1" />
              <input className="form-input" placeholder="Assinante 2" />
              <input className="form-input" placeholder="Cargo 2" />
            </div>
            <textarea
              className="form-input min-h-24"
              placeholder="Pauta, itens, deliberações ou observações"
            />
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Editor de texto"
        description="Edite diretamente no sistema com formatação básica."
        actions={
          <>
            <Button type="button" variant="outline" onClick={() => setFeedback("Prévia atualizada.")}>
              <Eye className="size-4" />
              Prévia
            </Button>
            <Button type="button" onClick={() => setFeedback("Documento salvo localmente.")}>
              <Save className="size-4" />
              Salvar
            </Button>
            <Button type="button" variant="outline" onClick={() => setFeedback("Texto exportado como TXT.")}>
              <Download className="size-4" />
              TXT
            </Button>
            <Button type="button" variant="outline" onClick={() => setFeedback("Documento exportado em PDF.")}>
              <FileText className="size-4" />
              PDF
            </Button>
          </>
        }
      >
        <div className="mb-3 flex flex-wrap gap-2">
          {["B", "I", "U", "Normal", "H1 Título", "Cláusula", "Tabela"].map((tool) => (
            <button
              key={tool}
              type="button"
              className="rounded-md border border-border bg-white px-2 py-1 text-xs font-medium"
              onClick={() => {
                setActiveTool(tool);
                setFeedback(`Ferramenta ${tool} selecionada.`);
              }}
            >
              {tool}
            </button>
          ))}
        </div>
        <label className="block">
          <span className="sr-only">Conteúdo do documento</span>
          <textarea
            className="form-input min-h-[520px] resize-y"
            placeholder="Digite o conteúdo do documento aqui..."
            defaultValue={"À quem interessar possa,\n\nA Cia de Artes Viva declara, para os devidos fins, que este documento integra a organização institucional e a prestação de contas do projeto cultural selecionado.\n\nAssinaturas:\n\n____________________________________\nMarcel Eduardo Cabeça Domingues - Diretor geral"}
          />
        </label>
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
          <Type className="size-4 text-primary" />
          Ferramenta ativa: {activeTool}. {feedback}
        </div>
      </SectionCard>
    </div>
  );
}
