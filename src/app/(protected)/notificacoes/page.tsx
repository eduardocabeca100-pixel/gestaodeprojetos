import { redirect } from "next/navigation";

import type { PageSearchParams } from "@/lib/utils/search-params";

export default async function NotificationsRedirectPage({
  searchParams,
}: {
  searchParams: PageSearchParams;
}) {
  const params = await searchParams;
  const project = Array.isArray(params.project) ? params.project[0] : params.project;

  redirect(project ? `/dashboard?project=${encodeURIComponent(project)}` : "/dashboard");
}
