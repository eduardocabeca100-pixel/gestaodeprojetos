import { PageContainer } from "@/components/layout/page-container";
import { UserManagementWorkspace } from "@/components/settings/user-management-workspace";
import { requireAuthorizedProfile } from "@/lib/auth/require-role";

export default async function UsersSettingsPage() {
  await requireAuthorizedProfile();

  return (
    <PageContainer
      title="Usuários e acesso"
      description="Crie acessos, defina papéis e marque a troca de senha no primeiro login."
    >
      <UserManagementWorkspace />
    </PageContainer>
  );
}
