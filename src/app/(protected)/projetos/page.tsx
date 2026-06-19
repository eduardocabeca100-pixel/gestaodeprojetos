import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { ProjectDataTable } from "@/components/projects/project-data-table";
import { Button } from "@/components/ui/button";
import { listProjects } from "@/modules/projects/queries";

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <PageContainer
      title="Projetos"
      description="CRUD de projetos culturais com status, valores, prazos e filtros."
      actions={
        <>
          <Button asChild variant="outline">
            <Link href="/projetos/selecionar">
              <FolderKanban className="size-4" />
              Escolher projeto
            </Link>
          </Button>
          <Button asChild>
            <Link href="/projetos/novo">
              <Plus className="size-4" />
              Novo projeto
            </Link>
          </Button>
        </>
      }
    >
      <SectionCard title="Projetos cadastrados" description="Busque por nome, edital ou status.">
        <ProjectDataTable projects={projects} />
      </SectionCard>
    </PageContainer>
  );
}
