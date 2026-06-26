import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";
import { getFeaturedProject, getProjectById } from "@/modules/projects/queries";

import {
  activityStatuses,
  activityTypes,
  type Activity,
  type ActivityStatus,
  type ActivityType,
} from "./types";

type ActivityRow = {
  id: string;
  project_id: string;
  title: string;
  type: string | null;
  date: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  responsible: string | null;
  description: string | null;
  status: string | null;
  attendance_count: number | null;
  photo_count: number | null;
  document_count: number | null;
  notes: string | null;
};

async function getScopedProject(projectId?: string) {
  return projectId
    ? (await getProjectById(projectId)) ?? (await getFeaturedProject())
    : getFeaturedProject();
}

function normalizeType(value: string | null): ActivityType {
  return activityTypes.includes(value as ActivityType) ? (value as ActivityType) : "Aula";
}

function normalizeStatus(value: string | null): ActivityStatus {
  return activityStatuses.includes(value as ActivityStatus)
    ? (value as ActivityStatus)
    : "Pendente";
}

function mapActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    type: normalizeType(row.type),
    date: row.date ?? "",
    startTime: row.start_time ?? "",
    endTime: row.end_time ?? "",
    location: row.location ?? "",
    responsible: row.responsible ?? "",
    description: row.description ?? "",
    status: normalizeStatus(row.status),
    attendanceCount: Number(row.attendance_count ?? 0),
    photoCount: Number(row.photo_count ?? 0),
    documentCount: Number(row.document_count ?? 0),
    notes: row.notes ?? "",
  };
}

export async function listActivities(projectId?: string) {
  const project = await getScopedProject(projectId);

  if (!hasSupabaseServerEnv()) {
    return [] satisfies Activity[];
  }

  const supabase = await createClient();

  if (!supabase) {
    return [] satisfies Activity[];
  }

  const { data, error } = await (supabase as any)
    .from("activities")
    .select("id, project_id, title, type, date, start_time, end_time, location, responsible, description, status, attendance_count, photo_count, document_count, notes")
    .eq("project_id", project.id)
    .order("date", { ascending: true });

  if (error || !data) {
    return [] satisfies Activity[];
  }

  return (data as ActivityRow[]).map(mapActivity);
}

export async function listUpcomingActivities(projectId?: string) {
  const activities = await listActivities(projectId);

  return activities
    .filter((activity) => activity.status === "Agendada" || activity.status === "Pendente")
    .slice(0, 4);
}
