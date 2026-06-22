import { PageContainer } from "@/components/layout/page-container";
import { RefensDataSeeder } from "@/components/refens/refens-data-seeder";

export default function ImportRefensPage() {
  return (
    <PageContainer
      title="Importar Reféns"
      description="Carregue no sistema os dados reais do projeto Formação de Artistas de Rua e Montagem do Espetáculo Reféns."
    >
      <RefensDataSeeder />
    </PageContainer>
  );
}
