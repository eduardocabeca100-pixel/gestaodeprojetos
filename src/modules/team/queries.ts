import { createClient } from "@/lib/supabase/server";
import { getFeaturedProject, getProjectById } from "@/modules/projects/queries";
import type { Project } from "@/modules/projects/types";

import type {
  TeamMember,
  TeamRosterMember,
  TeamRosterAssignment,
} from "./types";

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

// Team roster functions - global team management
export async function listTeamRoster() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team_roster")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (error) throw error;

  return (data || []).map((member) => ({
    id: member.id,
    name: member.name,
    role: member.role,
    phone: member.phone || "",
    email: member.email || "",
    document: member.document || "",
    bio: member.bio || "",
    avatarUrl: member.avatar_url,
    notes: member.notes || "",
    isActive: member.is_active,
    createdAt: member.created_at,
    updatedAt: member.updated_at,
  })) as TeamRosterMember[];
}

export async function getTeamRosterMember(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team_roster")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    role: data.role,
    phone: data.phone || "",
    email: data.email || "",
    document: data.document || "",
    bio: data.bio || "",
    avatarUrl: data.avatar_url,
    notes: data.notes || "",
    isActive: data.is_active,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  } as TeamRosterMember;
}

export async function createTeamRosterMember(
  data: Omit<TeamRosterMember, "id" | "createdAt" | "updatedAt" | "isActive">
) {
  const supabase = await createClient();

  const { data: created, error } = await supabase
    .from("team_roster")
    .insert({
      name: data.name,
      role: data.role,
      phone: data.phone || null,
      email: data.email || null,
      document: data.document || null,
      bio: data.bio || null,
      notes: data.notes || null,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: created.id,
    name: created.name,
    role: created.role,
    phone: created.phone || "",
    email: created.email || "",
    document: created.document || "",
    bio: created.bio || "",
    avatarUrl: created.avatar_url,
    notes: created.notes || "",
    isActive: created.is_active,
    createdAt: created.created_at,
    updatedAt: created.updated_at,
  } as TeamRosterMember;
}

export async function updateTeamRosterMember(
  id: string,
  data: Partial<Omit<TeamRosterMember, "id" | "createdAt" | "updatedAt">>
) {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.phone !== undefined) updateData.phone = data.phone || null;
  if (data.email !== undefined) updateData.email = data.email || null;
  if (data.document !== undefined) updateData.document = data.document || null;
  if (data.bio !== undefined) updateData.bio = data.bio || null;
  if (data.notes !== undefined) updateData.notes = data.notes || null;
  if (data.isActive !== undefined) updateData.is_active = data.isActive;

  const { data: updated, error } = await supabase
    .from("team_roster")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return {
    id: updated.id,
    name: updated.name,
    role: updated.role,
    phone: updated.phone || "",
    email: updated.email || "",
    document: updated.document || "",
    bio: updated.bio || "",
    avatarUrl: updated.avatar_url,
    notes: updated.notes || "",
    isActive: updated.is_active,
    createdAt: updated.created_at,
    updatedAt: updated.updated_at,
  } as TeamRosterMember;
}

export async function deleteTeamRosterMember(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("team_roster")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// Team roster assignments - link roster members to projects
export async function listTeamRosterAssignments(projectId: string) {
  const supabase = await createClient();

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

  return (data || []).map((assignment) => ({
    id: assignment.id,
    teamRosterId: assignment.team_roster_id,
    projectId: assignment.project_id,
    expectedAmount: assignment.expected_amount,
    paidAmount: assignment.paid_amount,
    paymentStatus: assignment.payment_status,
    notes: assignment.notes || "",
    assignedAt: assignment.assigned_at,
    rosterMember: assignment.team_roster
      ? {
          id: assignment.team_roster.id,
          name: assignment.team_roster.name,
          role: assignment.team_roster.role,
          phone: assignment.team_roster.phone || "",
          email: assignment.team_roster.email || "",
          document: assignment.team_roster.document || "",
          bio: assignment.team_roster.bio || "",
          avatarUrl: assignment.team_roster.avatar_url,
          notes: assignment.team_roster.notes || "",
          isActive: assignment.team_roster.is_active,
          createdAt: assignment.team_roster.created_at,
          updatedAt: assignment.team_roster.updated_at,
        }
      : undefined,
  })) as TeamRosterAssignment[];
}

export async function assignTeamRosterMember(
  data: Omit<TeamRosterAssignment, "id" | "assignedAt" | "rosterMember">
) {
  const supabase = await createClient();

  const { data: created, error } = await supabase
    .from("team_roster_assignments")
    .insert({
      team_roster_id: data.teamRosterId,
      project_id: data.projectId,
      expected_amount: data.expectedAmount,
      paid_amount: data.paidAmount,
      payment_status: data.paymentStatus,
      notes: data.notes || null,
    })
    .select()
    .single();

  if (error) throw error;

  return {
    id: created.id,
    teamRosterId: created.team_roster_id,
    projectId: created.project_id,
    expectedAmount: created.expected_amount,
    paidAmount: created.paid_amount,
    paymentStatus: created.payment_status,
    notes: created.notes || "",
    assignedAt: created.assigned_at,
  } as TeamRosterAssignment;
}

export async function updateTeamRosterAssignment(
  id: string,
  data: Partial<
    Omit<TeamRosterAssignment, "id" | "assignedAt" | "rosterMember">
  >
) {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {};
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

  return {
    id: updated.id,
    teamRosterId: updated.team_roster_id,
    projectId: updated.project_id,
    expectedAmount: updated.expected_amount,
    paidAmount: updated.paid_amount,
    paymentStatus: updated.payment_status,
    notes: updated.notes || "",
    assignedAt: updated.assigned_at,
  } as TeamRosterAssignment;
}

export async function unassignTeamRosterMember(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("team_roster_assignments")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
