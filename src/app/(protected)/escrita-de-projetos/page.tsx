export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function EscritaDeProjetosPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};
  const projectId = first(params.project || params.projectId);

  const iframeSrc = `/cerebro-ia/index.html?viva=1${
    projectId ? `&project=${encodeURIComponent(projectId)}` : ""
  }`;

  return (
    <main className="h-[calc(100vh-72px)] w-full max-w-none overflow-hidden bg-white">
      <iframe
        title="CÉREBRO IA — Escrita de Projetos"
        src={iframeSrc}
        className="h-full w-full border-0 bg-white"
      />
    </main>
  );
}
