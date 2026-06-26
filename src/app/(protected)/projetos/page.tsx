import Link from "next/link";
import { FolderKanban, Plus } from "lucide-react";

import { PageContainer } from "@/components/layout/page-container";
import { SectionCard } from "@/components/layout/section-card";
import { ProjectDataTable } from "@/components/projects/project-data-table";
import { Button } from "@/components/ui/button";
import { listProjects } from "@/modules/projects/queries";
import { can } from "@/lib/auth/permissions";
import { requireAuthorizedProfile } from "@/lib/auth/require-role";

export default async function ProjectsPage() {
  const [profile, projects] = await Promise.all([
    requireAuthorizedProfile(),
    listProjects(),
  ]);

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
          {can(profile.role, "create_project") ? (
            <Button asChild>
              <Link href="/projetos/novo">
                <Plus className="size-4" />
                Novo projeto
              </Link>
            </Button>
          ) : null}
        </>
      }
    >
      <SectionCard title="Projetos cadastrados" description="Busque por nome, edital ou status.">
        <ProjectDataTable projects={projects} canDelete={can(profile.role, "archive_project")} />
      </SectionCard>
    </PageContainer>
  );
}
