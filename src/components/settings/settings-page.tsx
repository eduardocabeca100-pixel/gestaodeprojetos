import { notFound } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { AppearanceSettingsWorkspace } from "@/components/settings/appearance-settings-workspace";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import { requireAuthorizedProfile } from "@/lib/auth/require-role";
import { getSettingsSection } from "@/modules/settings/queries";

export async function SettingsPage({ sectionId }: { sectionId: string }) {
  const [profile, section] = await Promise.all([
    requireAuthorizedProfile(["admin", "super_admin"]),
    getSettingsSection(sectionId),
  ]);

  if (!section) {
    notFound();
  }

  return (
    <PageContainer
      title="Configurações"
      description="Painel administrativo para identidade, módulos, permissões, relatórios, segurança e integrações."
    >
      {section.id === "aparencia" ? (
        <AppearanceSettingsWorkspace />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[252px_1fr]">
        <SettingsSidebar />
        <SettingsPanel section={section} role={profile.role} />
        </div>
      )}
    </PageContainer>
  );
}
