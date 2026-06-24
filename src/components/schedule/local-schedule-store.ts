"use client";

import type { Project } from "@/modules/projects/types";
import type { Activity } from "@/modules/schedule/types";

export const SCHEDULE_STORAGE_EVENT = "viva:schedule-updated";

type ProjectScheduleKey =
  | string
  | Pick<Project, "id" | "slug" | "name">;

function normalizeKeyPart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

function getProjectKeyParts(project: ProjectScheduleKey) {
  if (typeof project === "string") {
    return unique([project, normalizeKeyPart(project)]);
  }

  return unique([
    project.id,
    project.slug,
    normalizeKeyPart(project.name),
  ]);
}

function getScheduleStorageKeys(project: ProjectScheduleKey) {
  return getProjectKeyParts(project).map((key) => `viva:schedule:activities:${key}`);
}

function getEmptyStorageKeys(project: ProjectScheduleKey) {
  return getProjectKeyParts(project).map((key) => `viva:schedule:empty:${key}`);
}

function notifyScheduleUpdate(project: ProjectScheduleKey) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(SCHEDULE_STORAGE_EVENT, {
      detail: { project },
    }),
  );
}

export function readStoredScheduleActivities(
  project: ProjectScheduleKey,
  fallback: Activity[] = [],
): Activity[] {
  if (typeof window === "undefined") return fallback;

  try {
    const isMarkedEmpty = getEmptyStorageKeys(project).some(
      (key) => window.localStorage.getItem(key) === "1",
    );

    if (isMarkedEmpty) {
      return [];
    }

    for (const key of getScheduleStorageKeys(project)) {
      const saved = window.localStorage.getItem(key);

      if (saved === null) continue;

      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        return parsed as Activity[];
      }
    }

    return fallback;
  } catch (error) {
    console.warn("Não foi possível carregar o cronograma salvo.", error);
    return fallback;
  }
}

export function writeStoredScheduleActivities(
  project: ProjectScheduleKey,
  activities: Activity[],
) {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify(activities);

  for (const key of getScheduleStorageKeys(project)) {
    window.localStorage.setItem(key, payload);
  }

  for (const key of getEmptyStorageKeys(project)) {
    if (activities.length === 0) {
      window.localStorage.setItem(key, "1");
    } else {
      window.localStorage.removeItem(key);
    }
  }

  notifyScheduleUpdate(project);
}

export function resetStoredScheduleActivities(project: ProjectScheduleKey) {
  if (typeof window === "undefined") return;

  for (const key of getScheduleStorageKeys(project)) {
    window.localStorage.removeItem(key);
  }

  for (const key of getEmptyStorageKeys(project)) {
    window.localStorage.removeItem(key);
  }

  notifyScheduleUpdate(project);
}
