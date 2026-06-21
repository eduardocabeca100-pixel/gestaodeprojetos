import { AccessDenied } from "@/components/auth/access-denied";

export default async function AccessDeniedPage({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string }>;
}) {
  const { motivo } = await searchParams;

  return <AccessDenied noProjects={motivo === "sem-projeto"} />;
}
