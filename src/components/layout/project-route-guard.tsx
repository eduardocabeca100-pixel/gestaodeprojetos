"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { getActiveProjectScope } from "@/lib/project-scope";

const projectScopedRoutes = [
  "/dashboard",
  "/central-cultural",
  "/documentos",
  "/cronograma",
  "/diario-de-classe",
  "/financeiro",
  "/equipe",
  "/participantes",
  "/midia",
];

function isProjectScopedRoute(pathname: string) {
  return projectScopedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function ProjectRouteGuard() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (!isProjectScopedRoute(pathname)) {
      return;
    }

    if (searchParams.get("project")) {
      return;
    }

    const activeProject = getActiveProjectScope();

    if (activeProject.id && activeProject.id !== "sem-projeto") {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("project", activeProject.id);
      router.replace(`${pathname}?${nextParams.toString()}`);
      return;
    }

    router.replace("/projetos/selecionar");
  }, [pathname, router, searchParams]);

  return null;
}
