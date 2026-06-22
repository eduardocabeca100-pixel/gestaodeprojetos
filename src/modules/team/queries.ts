import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import { getFeaturedProject, getProjectById } from "@/modules/projects/queries";
import type { Project } from "@/modules/projects/types";

import type {
  TeamMember,
  TeamRosterMember,
  TeamRosterAssignment,
} from "./types";

type TeamRosterRow = Database["public"]["Tables"]["team_roster"]["Row"];
type TeamRosterInsert = Database["public"]["Tables"]["team_roster"]["Insert"];
type TeamRosterUpdate = Database["public"]["Tables"]["team_roster"]["Update"];
type TeamRosterAssignmentRow = Database["public"]["Tables"]["team_roster_assignments"]["Row"];
type TeamRosterAssignmentInsert = Database["public"]["Tables"]["team_roster_assignments"]["Insert"];
type TeamRosterAssignmentUpdate = Database["public"]["Tables"]["team_roster_assignments"]["Update"];
type TeamRosterAssignmentWithMemberRow = TeamRosterAssignmentRow & {
  team_roster: TeamRosterRow | null;
};

async function getScopedProject(projectId?: string) {
  return projectId
    ? (await getProjectById(projectId)) ?? (await getFeaturedProject())
    : getFeaturedProject();
}

function buildTeamMembers(project: Project): TeamMember[] {
  const directionPaid = Math.round(project.executedAmount * 0.35);
  const accessibilityPaid = Math.round(project.executedAmount * 0.12);
  const vocalPaid = Math.round(project.executedAmount * 0.18);

  return [
    {
      id: `${project.id}-team-direcao`,
      projectId: project.id,
      name: "Marcel Eduardo Cabeça Domingues",
      role: "Diretor geral",
      phone: "",
      email: "",
      document: "59.053.899/0001-53",
      expectedAmount: 6000,
      paidAmount: directionPaid,
      paymentStatus: directionPaid > 0 ? "Parcial" : "Previsto",
      documents: [`contrato-direcao-${project.slug}.pdf`],
      notes: `Responsável pelo projeto ${project.name}.`,
    },
    {
      id: `${project.id}-team-libras`,
      projectId: project.id,
      name: "Suzi Daiane",
      role: "Intérprete de Libras",
      phone: "",
      email: "",
      document: "",
      expectedAmount: 1200,
      paidAmount: accessibilityPaid,
      paymentStatus: accessibilityPaid > 0 ? "Parcial" : "Previsto",
      documents: [`acessibilidade-${project.slug}.pdf`],
      notes: "Responsável pela acessibilidade comunicacional do projeto.",
    },
    {
      id: `${project.id}-team-vocal`,
      projectId: project.id,
      name: "Katiana de Souza Coelho",
      role: "Preparador vocal",
      phone: "",
      email: "",
      document: "",
      expectedAmount: 1300,
      paidAmount: vocalPaid,
      paymentStatus: vocalPaid > 0 ? "Parcial" : "Previsto",
      documents: [`vocal-${project.slug}.pdf`],
      notes: "Preparação vocal e apoio musical do ciclo formativo.",
    },
  ];
}

// Legacy function - list team members for a specific project
export async function listTeamMembers(projectId?: string) {
  const project = await getScopedProject(projectId);
  return buildTeamMembers(project);
}

function mapTeamRosterMember(row: TeamRosterRow): TeamRosterMember {
  return {
    id: row.id,
    name: row.name,
    role: row.role as TeamRosterMember["role"],
    phone: row.phone || "",
    email: row.email || "",
    document: row.document || "",
    bio: row.bio || "",
    avatarUrl: row.avatar_url,
    notes: row.notes || "",
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapTeamRosterAssignment(row: TeamRosterAssignmentRow): TeamRosterAssignment {
  return {
    id: row.id,
    teamRosterId: row.team_roster_id,
    projectId: row.project_id,
    expectedAmount: row.expected_amount,
    paidAmount: row.paid_amount,
    paymentStatus: row.payment_status as TeamRosterAssignment["paymentStatus"],
    notes: row.notes || "",
    assignedAt: row.assigned_at,
  };
}

// Team roster functions - global team management
export async function listTeamRoster() {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase server env not configured");

  const { data, error } = await supabase
    .from("team_roster")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw error;

  return (data ?? []).map(mapTeamRosterMember);
}

export async function getTeamRosterMember(id: string) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase server env not configured");

  const { data: row, error } = await supabase
    .from("team_roster")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return mapTeamRosterMember(row);
}

export async function createTeamRosterMember(
  data: Omit<TeamRosterMember, "id" | "createdAt" | "updatedAt" | "isActive">
) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase server env not configured");

  const payload: TeamRosterInsert = {
    name: data.name,
    role: data.role,
    phone: data.phone || null,
    email: data.email || null,
    document: data.document || null,
    bio: data.bio || null,
    avatar_url: data.avatarUrl ?? null,
    notes: data.notes || null,
    is_active: true,
  };

  const { data: created, error } = await supabase
    .from("team_roster")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return mapTeamRosterMember(created);
}

export async function updateTeamRosterMember(
  id: string,
  data: Partial<Omit<TeamRosterMember, "id" | "createdAt" | "updatedAt">>
) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase server env not configured");

  const updateData: TeamRosterUpdate = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.phone !== undefined) updateData.phone = data.phone || null;
  if (data.email !== undefined) updateData.email = data.email || null;
  if (data.document !== undefined) updateData.document = data.document || null;
  if (data.bio !== undefined) updateData.bio = data.bio || null;
  if (data.avatarUrl !== undefined) updateData.avatar_url = data.avatarUrl;
  if (data.notes !== undefined) updateData.notes = data.notes || null;
  if (data.isActive !== undefined) updateData.is_active = data.isActive;

  const { data: updated, error } = await supabase
    .from("team_roster")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return mapTeamRosterMember(updated);
}

export async function deleteTeamRosterMember(id: string) {
  const supabase = await createClient();
    if (!supabase) throw new Error("Supabase server env not configured");

  const { error } = await supabase
    .from("team_roster")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// Team roster assignments - link roster members to projects
export async function listTeamRosterAssignments(projectId: string) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase server env not configured");

  const { data, error } = await supabase
    .from("team_roster_assignments")
    .select(
      `
      *,
      team_roster:team_roster_id (*)
    `
    )
    .eq("project_id", projectId)
    .order("assigned_at");

  if (error) throw error;

  const rows = (data ?? []) as TeamRosterAssignmentWithMemberRow[];

  return rows.map((assignment) => ({
    ...mapTeamRosterAssignment(assignment),
    rosterMember: assignment.team_roster
      ? mapTeamRosterMember(assignment.team_roster)
      : undefined,
  }));
}

export async function assignTeamRosterMember(
  data: Omit<TeamRosterAssignment, "id" | "assignedAt" | "rosterMember">
) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase server env not configured");

  const payload: TeamRosterAssignmentInsert = {
    team_roster_id: data.teamRosterId,
    project_id: data.projectId,
    expected_amount: data.expectedAmount,
    paid_amount: data.paidAmount,
    payment_status: data.paymentStatus,
    notes: data.notes || null,
  };

  const { data: created, error } = await supabase
    .from("team_roster_assignments")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;

  return mapTeamRosterAssignment(created);
}

export async function updateTeamRosterAssignment(
  id: string,
  data: Partial<
    Omit<TeamRosterAssignment, "id" | "assignedAt" | "rosterMember">
  >
) {
  const supabase = await createClient();
  if (!supabase) throw new Error("Supabase server env not configured");

  const updateData: TeamRosterAssignmentUpdate = {};
  if (data.expectedAmount !== undefined)
    updateData.expected_amount = data.expectedAmount;
  if (data.paidAmount !== undefined) updateData.paid_amount = data.paidAmount;
  if (data.paymentStatus !== undefined)
    updateData.payment_status = data.paymentStatus;
  if (data.notes !== undefined) updateData.notes = data.notes || null;

  const { data: updated, error } = await supabase
    .from("team_roster_assignments")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return mapTeamRosterAssignment(updated);
}

export async function unassignTeamRosterMember(id: string) {
  const supabase = await createClient();
    if (!supabase) throw new Error("Supabase server env not configured");

  const { error } = await supabase
    .from("team_roster_assignments")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
