"use client";

import { useEffect } from "react";

import { setActiveProjectScope } from "@/lib/project-scope";
import type { Project } from "@/modules/projects/types";

export function ActiveProjectScope({ project }: { project: Project }) {
  useEffect(() => {
    setActiveProjectScope({
      id: project.id,
      name: project.name,
      slug: project.slug,
    });
  }, [project.id, project.name, project.slug]);

  return null;
}
