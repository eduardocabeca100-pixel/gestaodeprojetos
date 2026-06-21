export const roles = [
  "admin",
  "super_admin",
  "diretor_executivo",
  "financeiro",
  "editor_projeto",
  "equipe_tecnica",
  "visualizador",
] as const;

export type Role = (typeof roles)[number];

export type Permission =
  | "create_project"
  | "edit_project"
  | "archive_project"
  | "delete_project"
  | "upload_documents"
  | "upload_media"
  | "view_finance"
  | "edit_finance"
  | "generate_report"
  | "view_participants"
  | "edit_participants"
  | "manage_users"
  | "change_settings"
  | "export_data"
  | "generate_dossier"
  | "access_backup";

const rolePermissions: Record<Role, Permission[]> = {
  admin: [
    "create_project",
    "edit_project",
    "archive_project",
    "delete_project",
    "upload_documents",
    "upload_media",
    "view_finance",
    "edit_finance",
    "generate_report",
    "view_participants",
    "edit_participants",
    "export_data",
    "generate_dossier",
  ],
  super_admin: [
    "create_project",
    "edit_project",
    "archive_project",
    "delete_project",
    "upload_documents",
    "upload_media",
    "view_finance",
    "edit_finance",
    "generate_report",
    "view_participants",
    "edit_participants",
    "manage_users",
    "change_settings",
    "export_data",
    "generate_dossier",
    "access_backup",
  ],
  diretor_executivo: [
    "edit_project",
    "upload_documents",
    "upload_media",
    "view_finance",
    "edit_finance",
    "generate_report",
    "view_participants",
    "edit_participants",
    "export_data",
    "generate_dossier",
  ],
  financeiro: ["view_finance", "edit_finance", "export_data"],
  editor_projeto: [
    "edit_project",
    "upload_documents",
    "upload_media",
    "view_participants",
    "edit_participants",
  ],
  equipe_tecnica: ["upload_documents", "upload_media", "view_participants"],
  visualizador: ["view_participants"],
};

export function can(role: Role, permission: Permission) {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function canAccessRole(role: string | null | undefined): role is Role {
  return dashboardRoles.includes(role as Role);
}

export const dashboardRoles: Role[] = [
  "admin",
  "super_admin",
  "diretor_executivo",
];

export const projectManagerRoles: Role[] = [
  "admin",
  "super_admin",
];

export function canAccessEveryProject(role: Role) {
  return projectManagerRoles.includes(role);
}
