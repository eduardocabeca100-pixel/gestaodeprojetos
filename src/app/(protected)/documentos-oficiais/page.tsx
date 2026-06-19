import { OfficialDocumentForm } from "@/components/official-documents/official-document-form";
import { SavedOfficialDocuments } from "@/components/official-documents/saved-official-documents";
import { TemplateGrid } from "@/components/official-documents/template-grid";
import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { getProjectId, type PageSearchParams } from "@/lib/utils/search-params";
import { listOfficialDocuments } from "@/modules/official-documents/queries";

export default async function OfficialDocumentsPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const projectId = await getProjectId(searchParams);
  const documents = await listOfficialDocuments();

  return (
    <PageContainer
      title="Documentos Oficiais"
      description="Central para criar ofícios, autorizações, termos, atas, declarações, recibos e documentos institucionais."
    >
      <ProjectScopeBanner projectId={projectId} />
      <SectionCard
        title="Logo especial dos documentos oficiais"
        description="Use uma logo própria para papel timbrado, ofícios e PDFs."
        actions={<input className="form-input max-w-72" type="file" accept="image/*" />}
      >
        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          Logo atual: VIVA Gestão Cultural. Formatos recomendados: PNG transparente
          ou SVG.
        </div>
      </SectionCard>
      <SectionCard title="Modelos rápidos">
        <TemplateGrid />
      </SectionCard>
      <OfficialDocumentForm />
      <SectionCard title="Documentos salvos">
        <SavedOfficialDocuments documents={documents} />
      </SectionCard>
    </PageContainer>
  );
}
