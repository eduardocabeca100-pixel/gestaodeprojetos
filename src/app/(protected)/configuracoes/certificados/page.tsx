import { PageContainer } from "@/components/layout/page-container";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import { CertificateSettingsForm } from "@/components/certificates/certificate-settings-form";
import { requireAuthorizedProfile } from "@/lib/auth/require-role";
import { getCertificateSettings } from "@/modules/certificates/queries";

export default async function CertificateSettingsPage() {
  await requireAuthorizedProfile(["super_admin"]);
  const settings = await getCertificateSettings();

  return (
    <PageContainer
      title="Configurações • Certificados"
      description="Identidade visual, páginas, assinaturas, logos, imagem final e padrões do documento."
    >
      <div className="grid gap-4 xl:grid-cols-[252px_1fr]">
        <SettingsSidebar />
        <CertificateSettingsForm initialSettings={settings} />
      </div>
    </PageContainer>
  );
}
