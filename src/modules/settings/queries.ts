import type { SettingsSection } from "./types";

export const settingsSections: SettingsSection[] = [
  {
    id: "geral",
    title: "Geral",
    description: "Identidade institucional e textos padrão.",
    fields: [
      { label: "Nome do sistema", value: "VIVA Gestão Cultural", type: "text" },
      { label: "Nome da instituição", value: "Cia de Artes Viva", type: "text" },
      { label: "Logo principal do sistema", value: "", type: "file" },
      { label: "Logo para fundo escuro", value: "", type: "file" },
      { label: "Logo dos documentos oficiais", value: "", type: "file" },
      { label: "E-mail institucional", value: "contato@ciaviva.local", type: "text" },
      { label: "WhatsApp", value: "(48) 99999-0000", type: "text" },
      { label: "Cidade", value: "Florianópolis", type: "text" },
      { label: "Estado", value: "SC", type: "text" },
      {
        label: "Rodapé padrão dos relatórios",
        value: "Cia de Artes Viva - Gestão Cultural",
        type: "textarea",
      },
      { label: "Assinatura padrão", value: "Direção executiva", type: "text" },
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
    id: "backup",
    title: "Backup e segurança",
    description: "Auditoria, lixeira e exportação dos dados.",
    fields: [
      { label: "Backup manual", value: "true", type: "toggle", lockedForDirector: true },
      { label: "Backup automático", value: "false", type: "toggle", lockedForDirector: true },
      { label: "Lixeira", value: "true", type: "toggle" },
      { label: "Confirmação dupla para exclusão", value: "true", type: "toggle", lockedForDirector: true },
      { label: "Tempo de sessão", value: "480", type: "number", lockedForDirector: true },
    ],
  },
  {
    id: "integracoes",
    title: "Integrações",
    description: "Serviços externos conectáveis ao projeto.",
    fields: [
      { label: "Google Drive", value: "Preparado", type: "text" },
      { label: "Google Calendar", value: "Preparado", type: "text" },
      { label: "Google Sheets", value: "Preparado", type: "text" },
      { label: "E-mail para notificações", value: "Preparado", type: "text" },
    ],
  },
  {
    id: "campos-personalizados",
    title: "Campos personalizados",
    description: "Campos extras por módulo.",
    fields: [
      { label: "Projetos", value: "Número do Pronac, Região, Área cultural", type: "textarea" },
      { label: "Participantes", value: "Ficha social, observação pedagógica", type: "textarea" },
      { label: "Financeiro", value: "Banco, Agência, Conta", type: "textarea" },
      { label: "Relatórios", value: "Assinatura, texto de abertura", type: "textarea" },
    ],
  },
];

export async function listSettingsSections() {
  return settingsSections;
}

export async function getSettingsSection(id: string) {
  return settingsSections.find((section) => section.id === id);
}
