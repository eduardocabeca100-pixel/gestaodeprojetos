"use client";

export const ACTIVE_PROJECT_EVENT = "viva:active-project-changed";
export const ACTIVE_PROJECT_STORAGE_KEY = "viva:active-project:v1";

export type ActiveProjectScope = {
  id: string;
  name: string;
  slug?: string;
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function setActiveProjectScope(project: ActiveProjectScope) {
  if (typeof window === "undefined") return;

  const safeProject = {
    id: String(project.id || "sem-projeto"),
    name: String(project.name || "Projeto sem nome"),
    slug: project.slug || normalize(String(project.name || project.id || "sem-projeto")),
  };

  window.localStorage.setItem(ACTIVE_PROJECT_STORAGE_KEY, JSON.stringify(safeProject));
  window.dispatchEvent(new CustomEvent(ACTIVE_PROJECT_EVENT, { detail: safeProject }));
}

export function getActiveProjectScope(): ActiveProjectScope {
  if (typeof window === "undefined") {
    return { id: "sem-projeto", name: "Projeto atual", slug: "sem-projeto" };
  }

  try {
    const saved = window.localStorage.getItem(ACTIVE_PROJECT_STORAGE_KEY);

    if (saved) {
      const parsed = JSON.parse(saved) as ActiveProjectScope;

      if (parsed?.id) {
        return {
          id: String(parsed.id),
          name: String(parsed.name || parsed.id),
          slug: parsed.slug || normalize(String(parsed.name || parsed.id)),
        };
      }
    }
  } catch {
    // fallback abaixo
  }

  const segments = window.location.pathname.split("/").filter(Boolean);
  const projectIndex = segments.indexOf("projetos");

  if (projectIndex >= 0 && segments[projectIndex + 1] && segments[projectIndex + 1] !== "novo") {
    const id = segments[projectIndex + 1];

    return { id, name: id, slug: normalize(id) };
  }

  return { id: "sem-projeto", name: "Projeto atual", slug: "sem-projeto" };
}

export function projectScopedKey(baseKey: string, projectId?: string) {
  const scope = projectId
    ? { id: projectId }
    : getActiveProjectScope();

  return `${baseKey}:project:${scope.id}`;
}
