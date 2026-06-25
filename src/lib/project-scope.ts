"use client";

export const ACTIVE_PROJECT_EVENT = "viva:active-project-changed";
export const ACTIVE_PROJECT_STORAGE_KEY = "viva:active-project:v1";

export type ActiveProjectScope = {
  id: string;
  name: string;
  slug?: string;
};

export function normalizeProjectValue(value: string) {
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
    slug: project.slug || normalizeProjectValue(String(project.name || project.id || "sem-projeto")),
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
          slug: parsed.slug || normalizeProjectValue(String(parsed.name || parsed.id)),
        };
      }
    }
  } catch {
    // usa fallback
  }

  const segments = window.location.pathname.split("/").filter(Boolean);
  const projectIndex = segments.indexOf("projetos");
  if (projectIndex >= 0 && segments[projectIndex + 1] && segments[projectIndex + 1] !== "novo") {
    const id = segments[projectIndex + 1];
    return { id, name: id, slug: normalizeProjectValue(id) };
  }

  return { id: "sem-projeto", name: "Projeto atual", slug: "sem-projeto" };
}

export function projectScopedKey(baseKey: string, projectId?: string) {
  const scope = projectId ? { id: projectId } : getActiveProjectScope();
  return `${baseKey}:project:${scope.id}`;
}

export function getProjectAliases(project?: ActiveProjectScope) {
  const scope = project ?? getActiveProjectScope();
  return Array.from(
    new Set(
      [
        scope.id,
        scope.slug,
        scope.name,
        normalizeProjectValue(scope.name),
        normalizeProjectValue(scope.slug || ""),
      ].filter(Boolean) as string[],
    ),
  );
}

function isProjectLike(value: unknown): value is ActiveProjectScope {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  const hasId = typeof record.id === "string" || typeof record.slug === "string";
  const hasName = typeof record.name === "string" || typeof record.title === "string";
  return hasId && hasName;
}

function toProject(value: Record<string, unknown>): ActiveProjectScope | null {
  const id = String(value.id || value.slug || "");
  const name = String(value.name || value.title || id || "");
  if (!id || !name) return null;
  return {
    id,
    name,
    slug: String(value.slug || normalizeProjectValue(name)),
  };
}

export function inferProjectScopeFromLocalStorage(): ActiveProjectScope[] {
  if (typeof window === "undefined") return [];

  const projects = new Map<string, ActiveProjectScope>();
  const active = getActiveProjectScope();

  if (active.id !== "sem-projeto" && active.name !== "Projeto atual") {
    projects.set(active.id, active);
  }

  for (const key of Object.keys(window.localStorage)) {
    const match = key.match(/:project:([^:]+)/);
    if (match?.[1]) {
      const id = match[1];
      projects.set(id, { id, name: id, slug: normalizeProjectValue(id) });
    }
  }

  try {
    const assignments = JSON.parse(window.localStorage.getItem("viva:project-team-assignments:v1") || "{}") as Record<string, unknown>;
    for (const id of Object.keys(assignments)) {
      projects.set(id, { id, name: id, slug: normalizeProjectValue(id) });
    }
  } catch {
    // ignora
  }

  for (const key of Object.keys(window.localStorage)) {
    if (!/project|projeto|viva/i.test(key)) continue;

    try {
      const parsed = JSON.parse(window.localStorage.getItem(key) || "null") as unknown;
      const values = Array.isArray(parsed) ? parsed : [parsed];

      for (const item of values) {
        if (isProjectLike(item)) {
          const project = toProject(item as Record<string, unknown>);
          if (project) projects.set(project.id, project);
        }

        if (item && typeof item === "object") {
          for (const nested of Object.values(item as Record<string, unknown>)) {
            if (Array.isArray(nested)) {
              for (const entry of nested) {
                if (isProjectLike(entry)) {
                  const project = toProject(entry as Record<string, unknown>);
                  if (project) projects.set(project.id, project);
                }
              }
            }
          }
        }
      }
    } catch {
      // ignora
    }
  }

  return Array.from(projects.values());
}
