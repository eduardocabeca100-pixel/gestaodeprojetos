import { PageContainer } from "@/components/layout/page-container";
import { ResumeBankWorkspace } from "@/components/resumes/resume-bank-workspace";

export default function ResumeBankPage() {
  return (
    <PageContainer
      title="Banco de Currículos"
      description="Cadastro de profissionais, modelos por edital e geração de currículos em PDF e Word."
    >
      <ResumeBankWorkspace />
    </PageContainer>
  );
}
