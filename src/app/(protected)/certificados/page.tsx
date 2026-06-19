import Link from "next/link";
import { Award, ArrowRight } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { ProjectScopeBanner } from "@/components/projects/project-scope-banner";
import { CertificateWorkspace } from "@/components/certificates/certificate-workspace";
import { Button } from "@/components/ui/button";
import { getActiveProject, type PageSearchParams } from "@/lib/utils/search-params";
import { getCertificateWorkspaceData } from "@/modules/certificates/queries";

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const project = await getActiveProject(searchParams);
  const data = await getCertificateWorkspaceData(project.id);

  return (
    <PageContainer
      title="Certificados"
      description="Emissão de certificados com prévia frente e verso, alunos vinculados ao projeto e histórico centralizado."
      actions={
        <Button asChild variant="outline">
          <Link href={`/projetos/${project.id}/certificados`}>
            <Award className="size-4" />
            Abrir no projeto
          </Link>
        </Button>
      }
    >
      <ProjectScopeBanner projectId={project.id} />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Você está no projeto ativo:</span>
        <span className="font-semibold text-foreground">{project.name}</span>
        <ArrowRight className="size-4" />
        <Link className="font-medium text-primary" href={`/projetos/${project.id}/certificados`}>
          Ver certificado do projeto
        </Link>
      </div>
      <CertificateWorkspace data={data} scope="global" />
    </PageContainer>
  );
}
