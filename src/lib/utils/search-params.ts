import { getFeaturedProject, getProjectById } from "@/modules/projects/queries";

export type PageSearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

export async function getProjectId(searchParams?: PageSearchParams) {
  const params = searchParams ? await searchParams : {};
  const value = params.project;

  return Array.isArray(value) ? value[0] : value;
}

export async function getActiveProject(searchParams?: PageSearchParams) {
  const projectId = await getProjectId(searchParams);

  if (!projectId) {
    return getFeaturedProject();
  }

  return (await getProjectById(projectId)) ?? getFeaturedProject();
}
