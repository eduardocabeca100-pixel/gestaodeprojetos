import { PageContainer } from "@/components/layout/page-container";
import { ResumeBankWorkspace } from "@/components/resumes/resume-bank-workspace";

export default function ResumeBankPage() {
  return (
    <PageContainer
      title="Banco de Currículos"
      description="Cadastro de profissionais, arquivos, modelos de edital e geração de currículos em PDF ou Word."
    >
      <ResumeBankWorkspace />
    </PageContainer>
  );
}
