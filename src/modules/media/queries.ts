import { createClient, hasSupabaseServerEnv } from "@/lib/supabase/server";
import { getFeaturedProject, getProjectById } from "@/modules/projects/queries";

import {
  mediaCategories,
  mediaTypes,
  type MediaCategory,
  type MediaItem,
  type MediaType,
} from "./types";

type MediaRow = {
  id: string;
  project_id: string;
  activity_id: string | null;
  title: string;
  type: string | null;
  registered_at: string | null;
  location: string | null;
  description: string | null;
  url: string | null;
  category: string | null;
  selected_for_dossier: boolean | null;
};

async function getScopedProject(projectId?: string) {
  return projectId
    ? (await getProjectById(projectId)) ?? (await getFeaturedProject())
    : getFeaturedProject();
}

function normalizeType(value: string | null): MediaType {
  return mediaTypes.includes(value as MediaType) ? (value as MediaType) : "Foto";
}

function normalizeCategory(value: string | null): MediaCategory {
  return mediaCategories.includes(value as MediaCategory)
    ? (value as MediaCategory)
    : "Outros";
}

function mapMedia(row: MediaRow): MediaItem {
  return {
    id: row.id,
    projectId: row.project_id,
    activityId: row.activity_id,
    title: row.title,
    type: normalizeType(row.type),
    registeredAt: row.registered_at ?? "",
    location: row.location ?? "",
    description: row.description ?? "",
    url: row.url ?? "",
    category: normalizeCategory(row.category),
    selectedForDossier: Boolean(row.selected_for_dossier),
  };
}

export async function listMediaItems(projectId?: string) {
  const project = await getScopedProject(projectId);

  if (!hasSupabaseServerEnv()) {
    return [] satisfies MediaItem[];
  }

  const supabase = await createClient();

  if (!supabase) {
    return [] satisfies MediaItem[];
  }

  const { data, error } = await (supabase as any)
    .from("media")
    .select("id, project_id, activity_id, title, type, registered_at, location, description, url, category, selected_for_dossier")
    .eq("project_id", project.id)
    .order("registered_at", { ascending: false });

  if (error || !data) {
    return [] satisfies MediaItem[];
  }

  return (data as MediaRow[]).map(mapMedia);
}
