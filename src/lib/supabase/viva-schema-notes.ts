export const vivaSupabaseTables = [
  "viva_projects",
  "viva_team_members",
  "viva_project_team",
  "viva_project_team_costs",
  "viva_project_payments",
  "viva_project_rubrics",
  "viva_project_tasks",
  "viva_project_pending_items",
  "viva_project_documents",
  "viva_pdf_settings",
];

export const vivaSupabaseNotes = {
  storage: "Para anexos em produção, use Supabase Storage e grave o caminho em viva_project_documents.storage_path.",
  payments: "Pagamentos devem gravar em viva_project_payments e atualizar viva_project_team.paid_amount / payment_status.",
  teamCosts: "A composição do valor previsto por pessoa fica em viva_project_team_costs.",
};
