import { AlertTriangle, Archive, FileCheck2 } from "lucide-react";

import { DocumentCategoryCard } from "@/components/documents/document-category-card";
import { DocumentList } from "@/components/documents/document-list";
import { DocumentPreview } from "@/components/documents/document-preview";
import { DocumentUpload } from "@/components/documents/document-upload";
import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { listDocuments } from "@/modules/documents/queries";

export default async function DocumentsPage() {
  const documents = await listDocuments();

  return (
    <PageContainer
      title="Documentos"
      description="Upload, visualização, validade, substituição e arquivamento de documentos vinculados a projetos."
    >
      <div className="grid gap-4 md:grid-cols-3">
        <DocumentCategoryCard title="Documentos válidos" count={2} icon={FileCheck2} tone="bg-emerald-50 text-emerald-700" />
        <DocumentCategoryCard title="Alertas de validade" count={1} icon={AlertTriangle} tone="bg-amber-50 text-amber-700" />
        <DocumentCategoryCard title="Arquivados" count={0} icon={Archive} tone="bg-slate-50 text-slate-700" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <SectionCard title="Lista de documentos" description="Busca e filtros por categoria, status e validade.">
          <DocumentList documents={documents} />
        </SectionCard>
        <SectionCard title="Upload">
          <DocumentUpload />
        </SectionCard>
      </div>
      <DocumentPreview />
    </PageContainer>
  );
}
