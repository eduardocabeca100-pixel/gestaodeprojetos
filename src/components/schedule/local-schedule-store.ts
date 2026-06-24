"use client";

import type { Activity } from "@/modules/schedule/types";

export const SCHEDULE_STORAGE_EVENT = "viva:schedule-updated";

function getScheduleStorageKey(projectId: string) {
  return `viva:schedule:activities:${projectId}`;
}

function notifyScheduleUpdate(projectId: string) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(SCHEDULE_STORAGE_EVENT, {
      detail: { projectId },
    }),
  );
}

export function readStoredScheduleActivities(
  projectId: string,
  fallback: Activity[] = [],
): Activity[] {
  if (typeof window === "undefined") return fallback;

  try {
    const saved = window.localStorage.getItem(getScheduleStorageKey(projectId));

    if (saved === null) {
      return fallback;
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return fallback;
    }

    return parsed as Activity[];
  } catch (error) {
    console.warn("Não foi possível carregar o cronograma salvo.", error);
    return fallback;
  }
}

export function writeStoredScheduleActivities(projectId: string, activities: Activity[]) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(getScheduleStorageKey(projectId), JSON.stringify(activities));
  notifyScheduleUpdate(projectId);
}

export function resetStoredScheduleActivities(projectId: string) {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(getScheduleStorageKey(projectId));
  notifyScheduleUpdate(projectId);
}
