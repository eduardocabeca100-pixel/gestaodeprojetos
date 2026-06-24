import { PageContainer } from "@/components/layout/page-container";
import { CulturalManagementSuite } from "@/components/management/cultural-management-suite";

export default function CentralCulturalPage() {
  return (
    <PageContainer
      title="Central Cultural"
      description="Gestão de execução, prazos, documentos, relatórios, prestação de contas e demonstrativos administrativos."
    >
      <CulturalManagementSuite />
    </PageContainer>
  );
}
