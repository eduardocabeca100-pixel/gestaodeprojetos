"use server";

import {
  teamMemberSchema,
  teamRosterMemberSchema,
  teamRosterAssignmentSchema,
} from "./schemas";
import {
  createTeamRosterMember,
  updateTeamRosterMember,
  deleteTeamRosterMember,
  assignTeamRosterMember,
  updateTeamRosterAssignment,
  unassignTeamRosterMember,
} from "./queries";

export async function saveTeamMember(formData: FormData) {
  const parsed = teamMemberSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return {
      ok: false,
      message: "Revise o cadastro da equipe.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  return { ok: true, message: "Integrante validado." };
}

export async function createTeamRoster(formData: FormData) {
  try {
    const parsed = teamRosterMemberSchema.safeParse(
      Object.fromEntries(formData)
    );

    if (!parsed.success) {
      return {
        ok: false,
        message: "Revise os dados do membro.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const payload = {
      ...parsed.data,
      avatarUrl: parsed.data.avatarUrl ?? null,
    };

    const member = await createTeamRosterMember(payload);

    return {
      ok: true,
      message: "Membro adicionado à equipe com sucesso!",
      data: member,
    };
  } catch (error) {
    return {
      ok: false,
      message: "Erro ao adicionar membro. Tente novamente.",
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

export async function editTeamRoster(id: string, formData: FormData) {
  try {
    const parsed = teamRosterMemberSchema.partial().safeParse(
      Object.fromEntries(formData)
    );

    if (!parsed.success) {
      return {
        ok: false,
        message: "Revise os dados do membro.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const member = await updateTeamRosterMember(id, parsed.data);

    return {
      ok: true,
      message: "Membro atualizado com sucesso!",
      data: member,
    };
  } catch (error) {
    return {
      ok: false,
      message: "Erro ao atualizar membro. Tente novamente.",
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

export async function removeTeamRoster(id: string) {
  try {
    await deleteTeamRosterMember(id);

    return {
      ok: true,
      message: "Membro removido com sucesso!",
    };
  } catch (error) {
    return {
      ok: false,
      message: "Erro ao remover membro. Tente novamente.",
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

export async function assignTeamToProject(formData: FormData) {
  try {
    const parsed = teamRosterAssignmentSchema.safeParse(
      Object.fromEntries(formData)
    );

    if (!parsed.success) {
      return {
        ok: false,
        message: "Revise os dados da atribuição.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const assignment = await assignTeamRosterMember(parsed.data);

    return {
      ok: true,
      message: "Membro atribuído ao projeto com sucesso!",
      data: assignment,
    };
  } catch (error) {
    return {
      ok: false,
      message: "Erro ao atribuir membro. Tente novamente.",
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

export async function updateTeamAssignment(id: string, formData: FormData) {
  try {
    const parsed = teamRosterAssignmentSchema.partial().safeParse(
      Object.fromEntries(formData)
    );

    if (!parsed.success) {
      return {
        ok: false,
        message: "Revise os dados da atribuição.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const assignment = await updateTeamRosterAssignment(id, parsed.data);

    return {
      ok: true,
      message: "Atribuição atualizada com sucesso!",
      data: assignment,
    };
  } catch (error) {
    return {
      ok: false,
      message: "Erro ao atualizar atribuição. Tente novamente.",
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

export async function removeTeamAssignment(id: string) {
  try {
    await unassignTeamRosterMember(id);

    return {
      ok: true,
      message: "Membro removido do projeto com sucesso!",
    };
  } catch (error) {
    return {
      ok: false,
      message: "Erro ao remover membro do projeto. Tente novamente.",
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}
