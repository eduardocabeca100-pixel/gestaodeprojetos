import { PageContainer } from "@/components/layout/page-container";
import { UserManagementWorkspace } from "@/components/settings/user-management-workspace";
import { requireAuthorizedProfile } from "@/lib/auth/require-role";
import { listProjects } from "@/modules/projects/queries";
import { listUsersWithProjectAccess } from "@/modules/users/queries";

export default async function UsersSettingsPage() {
  await requireAuthorizedProfile(["admin", "super_admin"]);
  const [projects, users] = await Promise.all([
    listProjects(),
    listUsersWithProjectAccess(),
  ]);

  return (
    <PageContainer
      title="Usuários e acesso"
      description="Defina quem entra no sistema e exatamente quais projetos cada pessoa pode visualizar."
    >
      <UserManagementWorkspace projects={projects} users={users} />
    </PageContainer>
  );
}
