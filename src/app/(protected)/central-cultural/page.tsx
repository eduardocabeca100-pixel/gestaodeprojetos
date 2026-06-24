import { PageContainer } from "@/components/layout/page-container";
import { CulturalManagementSuite } from "@/components/management/cultural-management-suite";

export default function CentralCulturalPage() {
  return (
    <PageContainer
      title="Central Cultural"
      description="Alertas, documentos, relatório de execução, rubricas, contratos, prestação de contas e dashboard geral da companhia."
    >
      <CulturalManagementSuite />
    </PageContainer>
  );
}
