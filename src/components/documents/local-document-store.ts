"use client";

import { projectScopedKey } from "@/lib/project-scope";
import type { ProjectDocument } from "@/modules/documents/types";

const STORAGE_KEY_BASE = "viva:project-documents:v1";

export function readStoredProjectDocuments(
  projectId: string,
  fallback: ProjectDocument[],
): ProjectDocument[] {
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const saved = window.localStorage.getItem(projectScopedKey(STORAGE_KEY_BASE, projectId));

    if (!saved) {
      return fallback;
    }

    const parsed = JSON.parse(saved) as ProjectDocument[];
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function writeStoredProjectDocuments(
  projectId: string,
  documents: ProjectDocument[],
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    projectScopedKey(STORAGE_KEY_BASE, projectId),
    JSON.stringify(documents),
  );
}
