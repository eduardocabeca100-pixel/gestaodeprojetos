import type { SettingsSection } from "./types";

export const settingsSections: SettingsSection[] = [
  {
    id: "geral",
    title: "Geral",
    description: "Identidade institucional e textos padrão.",
    fields: [
      { label: "Nome do sistema", value: "VIVA Gestão Cultural", type: "text" },
      { label: "Nome da instituição", value: "Cia de Artes Viva", type: "text" },
      { label: "CNPJ", value: "", type: "text" },
      { label: "Logo principal do sistema", value: "", type: "file" },
      { label: "Logo para fundo escuro", value: "", type: "file" },
      { label: "Logo dos documentos oficiais", value: "", type: "file" },
      { label: "E-mail institucional", value: "eduardo@ciaviva.com", type: "text" },
      { label: "WhatsApp", value: "(47) 992747545", type: "text" },
      { label: "Site", value: "www.ciaviva.com", type: "text" },
      { label: "Endereço", value: "", type: "text" },
      { label: "Cidade", value: "Jaraguá do Sul", type: "text" },
      { label: "Estado", value: "SC", type: "text" },
      {
        label: "Rodapé padrão dos relatórios",
        value: "Cia de Artes Viva - Gestão Cultural",
        type: "textarea",
      },
      { label: "Assinatura padrão", value: "Marcel Eduardo Cabeça Domingues", type: "text" },
      { label: "Assinatura digital do diretor geral", value: "", type: "file" },
      { label: "Assinatura digital do diretor executivo", value: "", type: "file" },
      { label: "Assinatura digital do responsável do projeto", value: "", type: "file" },
      { label: "Cargo do assinante principal", value: "Direção geral", type: "text" },
    ],
  },
  {
    id: "aparencia",
    title: "Aparência",
    description: "Tema, cores, densidade e organização visual.",
    fields: [
      { label: "Tema", value: "Claro", type: "select" },
      { label: "Fonte do painel", value: "Arial / Helvetica", type: "select" },
      { label: "Cor principal", value: "#7c3aed", type: "color" },
      { label: "Cor secundária", value: "#0f172a", type: "color" },
      { label: "Cor de sucesso", value: "#059669", type: "color" },
      { label: "Cor de alerta", value: "#d97706", type: "color" },
      { label: "Arredondamento dos cards", value: "8", type: "number" },
      { label: "Ativar animações", value: "true", type: "toggle" },
      { label: "Layout do dashboard", value: "padrão", type: "select" },
    ],
  },
  {
    id: "projetos",
    title: "Projetos",
    description: "Status, etapas e regras do cadastro de projetos.",
    fields: [
      { label: "Status personalizados", value: "Status padrão PNAB", type: "textarea" },
      { label: "Ativar foto de capa", value: "true", type: "toggle" },
      { label: "Ativar banner interno", value: "true", type: "toggle" },
      { label: "Permitir duplicar projeto", value: "true", type: "toggle" },
      {
        label: "Exclusão definitiva apenas para admin",
        value: "true",
        type: "toggle",
        lockedForDirector: true,
      },
    ],
  },
  {
    id: "documentos",
    title: "Documentos",
    description: "Categorias, formatos e alertas de vencimento.",
    fields: [
      { label: "Formatos permitidos", value: "PDF, JPG, PNG, DOCX, XLSX, CSV, ZIP", type: "textarea" },
      { label: "Bloquear upload de vídeos", value: "true", type: "toggle" },
      { label: "Alerta de vencimento", value: "true", type: "toggle" },
      { label: "Dias antes do alerta", value: "20", type: "number" },
      { label: "Exigir projeto vinculado", value: "true", type: "toggle" },
      { label: "Tipos de documentos do projeto", value: "Termo de execução, Plano de trabalho, Certidões, Contratos, Notas fiscais, Recibos, Comprovantes, Fotos, Relatórios, Autorização de imagem, Lista de presença, Comprovante bancário", type: "textarea" },
      { label: "Alertar certidões vencidas", value: "true", type: "toggle" },
      { label: "Alertar contratos sem assinatura", value: "true", type: "toggle" },
      { label: "Alertar prestação pendente", value: "true", type: "toggle" },
    ],
  },
  {
    id: "midia",
    title: "Mídia e fotos",
    description: "Galeria, links externos e seleção para dossiê.",
    fields: [
      { label: "Permitir upload de fotos", value: "true", type: "toggle" },
      { label: "Permitir link de vídeo", value: "true", type: "toggle" },
      { label: "Serviços permitidos", value: "Google Drive, YouTube, Vimeo, OneDrive", type: "textarea" },
      { label: "Bloquear upload direto de vídeo", value: "true", type: "toggle" },
      { label: "Marca d'água opcional", value: "false", type: "toggle" },
    ],
  },
  {
    id: "cronograma",
    title: "Cronograma",
    description: "Tipos de atividade, lembretes e modelos de aula.",
    fields: [
      { label: "Horário padrão", value: "19:00", type: "text" },
      { label: "Local padrão", value: "Cia de Artes Viva", type: "text" },
      { label: "Ativar lembretes", value: "true", type: "toggle" },
      { label: "Dias antes do alerta", value: "7", type: "number" },
      { label: "Permitir recorrência", value: "true", type: "toggle" },
    ],
  },
  {
    id: "financeiro",
    title: "Financeiro",
    description: "Rubricas, pagamentos e regras de comprovação.",
    fields: [
      { label: "Alerta de saldo baixo", value: "true", type: "toggle" },
      { label: "Alerta de rubrica excedida", value: "true", type: "toggle" },
      { label: "Exigir comprovante para pago", value: "true", type: "toggle" },
      { label: "Exigir nota/recibo para pago", value: "true", type: "toggle" },
      { label: "Modelo de relatório financeiro", value: "Institucional", type: "select" },
      { label: "Rubricas padrão", value: "Equipe, Produção, Divulgação, Transporte, Alimentação, Cenografia, Figurino, Sonorização, Iluminação, Acessibilidade, Administrativo", type: "textarea" },
      { label: "Alertar pagamento vencido", value: "true", type: "toggle" },
      { label: "Permitir demonstrativo para fornecedor", value: "true", type: "toggle" },
    ],
  },
  {
    id: "relatorios",
    title: "Relatórios",
    description: "Modelo visual, capas, assinatura e exportações.",
    fields: [
      { label: "Modelo visual", value: "Institucional limpo", type: "select" },
      { label: "Incluir assinatura", value: "true", type: "toggle" },
      { label: "Incluir fotos", value: "true", type: "toggle" },
      { label: "Quantidade de fotos por página", value: "6", type: "number" },
      { label: "Texto padrão de encerramento", value: "Relatório gerado pelo VIVA Gestão Cultural.", type: "textarea" },
      { label: "Assinatura do diretor geral nos PDFs", value: "true", type: "toggle" },
      { label: "Assinatura do diretor executivo nos PDFs", value: "true", type: "toggle" },
      { label: "Usar rodapé institucional nos PDFs", value: "true", type: "toggle" },
    ],
  },
  {
    id: "usuarios",
    title: "Usuários e permissões",
    description: "Acesso restrito ao administrador geral.",
    fields: [
      { label: "Criar usuário", value: "true", type: "toggle", lockedForDirector: true },
      { label: "Alterar role", value: "true", type: "toggle", lockedForDirector: true },
      { label: "Resetar senha", value: "true", type: "toggle", lockedForDirector: true },
      { label: "Ver ações realizadas", value: "true", type: "toggle", lockedForDirector: true },
    ],
  },
  {
    id: "seguranca",
    title: "Segurança de acesso",
    description: "Troca de senha, primeiro login e políticas de acesso.",
    fields: [
      { label: "Senha atual", value: "", type: "password" },
      { label: "Nova senha", value: "", type: "password" },
      { label: "Exigir troca no primeiro login", value: "true", type: "toggle", lockedForDirector: true },
      { label: "Permitir super admin", value: "true", type: "toggle", lockedForDirector: true },
    ],
  },
  {
    id: "integracoes",
    title: "Integrações",
    description: "Serviços externos conectáveis ao projeto.",
    fields: [
      { label: "Google Drive", value: "Não conectado", type: "text" },
      { label: "Pasta raiz Google Drive", value: "", type: "text" },
      { label: "Google Calendar", value: "Não conectado", type: "text" },
      { label: "ID do calendário", value: "", type: "text" },
      { label: "Google Sheets", value: "Não conectado", type: "text" },
      { label: "ID da planilha", value: "", type: "text" },
      { label: "E-mail para notificações", value: "", type: "text" },
      { label: "Enviar alerta de vencimento por e-mail", value: "false", type: "toggle" },
    ],
  },

];

export async function listSettingsSections() {
  return settingsSections;
}

export async function getSettingsSection(id: string) {
  return settingsSections.find((section) => section.id === id);
}
