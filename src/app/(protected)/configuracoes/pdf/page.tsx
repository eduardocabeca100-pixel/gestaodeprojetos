import { PageContainer } from "@/components/layout/page-container";
import { PdfBrandingSettings } from "@/components/pdf/pdf-branding-settings";

export default function PdfSettingsPage() {
  return (
    <PageContainer
      title="Modelo de PDF"
      description="Edite o cabeçalho, rodapé, logo, dados institucionais e visualize o modelo A4 usado nas exportações."
    >
      <PdfBrandingSettings />
    </PageContainer>
  );
}
