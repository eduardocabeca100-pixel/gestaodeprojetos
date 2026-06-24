"use client";

import type { Project } from "@/modules/projects/types";
import type { Activity } from "@/modules/schedule/types";

export const SCHEDULE_STORAGE_EVENT = "viva:schedule-updated";

type ProjectScheduleKey = Project | string;

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function unique(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter(Boolean) as string[]));
}

function projectKeys(project: ProjectScheduleKey) {
  if (typeof project === "string") {
    return unique([project, normalize(project)]);
  }

  return unique([
    project.id,
    project.slug,
    project.name,
    normalize(project.name),
    normalize(project.slug),
  ]);
}

function activityKeys(project: ProjectScheduleKey) {
  return projectKeys(project).map((key) => `viva:schedule:activities:${key}`);
}

function emptyKeys(project: ProjectScheduleKey) {
  return projectKeys(project).map((key) => `viva:schedule:empty:${key}`);
}

function notify(project: ProjectScheduleKey) {
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

  const hasEmptyFlag = emptyKeys(project).some(
    (key) => window.localStorage.getItem(key) === "1",
  );

  if (hasEmptyFlag) {
    return [];
  }

  for (const key of activityKeys(project)) {
    const saved = window.localStorage.getItem(key);

    if (!saved) continue;

    try {
      const parsed = JSON.parse(saved);

      if (Array.isArray(parsed)) {
        return parsed as Activity[];
      }
    } catch {
      continue;
    }
  }

  return fallback;
}

export function writeStoredScheduleActivities(
  project: ProjectScheduleKey,
  activities: Activity[],
) {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify(activities);

  for (const key of activityKeys(project)) {
    window.localStorage.setItem(key, payload);
  }

  for (const key of emptyKeys(project)) {
    if (activities.length === 0) {
      window.localStorage.setItem(key, "1");
    } else {
      window.localStorage.removeItem(key);
    }
  }

  notify(project);
}

export function forceEmptySchedule(project: ProjectScheduleKey) {
  if (typeof window === "undefined") return;

  for (const key of activityKeys(project)) {
    window.localStorage.setItem(key, "[]");
  }

  for (const key of emptyKeys(project)) {
    window.localStorage.setItem(key, "1");
  }

  notify(project);
}

export function resetStoredScheduleActivities(project: ProjectScheduleKey) {
  if (typeof window === "undefined") return;

  for (const key of activityKeys(project)) {
    window.localStorage.removeItem(key);
  }

  for (const key of emptyKeys(project)) {
    window.localStorage.removeItem(key);
  }

  notify(project);
}
