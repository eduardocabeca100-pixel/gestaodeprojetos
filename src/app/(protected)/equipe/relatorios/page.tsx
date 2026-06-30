import { TeamMemberReportWorkspace } from "@/components/team/team-member-report-workspace";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function EquipeRelatoriosPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const projectId = first(params.project || params.projectId);

  return (
    <main className="w-full max-w-none px-4 py-6 sm:px-6 lg:px-8">
      <TeamMemberReportWorkspace projectId={projectId} />
    </main>
  );
}
