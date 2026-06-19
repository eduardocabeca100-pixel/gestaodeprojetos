export type PageSearchParams = Promise<{
  [key: string]: string | string[] | undefined;
}>;

export async function getProjectId(searchParams?: PageSearchParams) {
  const params = searchParams ? await searchParams : {};
  const value = params.project;

  return Array.isArray(value) ? value[0] : value;
}
