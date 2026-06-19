insert into public.projects (
  name,
  full_title,
  slug,
  short_description,
  summary,
  edital,
  registration_number,
  approved_amount,
  executed_amount,
  status,
  current_stage,
  modality,
  class_name,
  proponent,
  proponent_document,
  city,
  state,
  start_date,
  end_date,
  notes
) values (
  'Reféns',
  'Formação de Artistas de Rua e Montagem do Espetáculo Reféns',
  'formacao-artistas-rua-espetaculo-refens',
  'Projeto de formação cênica e montagem teatral com artistas de rua.',
  'Formação organizada em aulas, ensaios, registros documentais, mídia e prestação de contas final.',
  'Circuito Catarinense de Cultura PNAB SC 2026',
  '000937',
  50000,
  8500,
  'Classificado',
  'Habilitação em andamento',
  'Ações de Qualificação e Formação',
  'Classe II',
  'Cia de Artes Viva',
  '00.000.000/0001-00',
  'Florianópolis',
  'SC',
  '2026-08-01',
  '2027-07-31',
  'Seed inicial do sistema.'
) on conflict (slug) do nothing;

with refens as (
  select id
  from public.projects
  where slug = 'formacao-artistas-rua-espetaculo-refens'
)
insert into public.project_stages (project_id, name, position, completed_at, notes)
select refens.id, stage.name, stage.position, stage.completed_at, stage.notes
from refens
cross join (
  values
    ('Avaliação', 1, '2026-06-10 12:00:00+00'::timestamptz, 'Projeto aprovado na avaliação inicial.'),
    ('Habilitação', 2, '2026-06-19 12:00:00+00'::timestamptz, 'Documentos e anexos em organização.'),
    ('Assinatura do termo', 3, null::timestamptz, 'Aguardando assinatura formal.'),
    ('Repasse', 4, null::timestamptz, 'Aguardando liberação financeira.'),
    ('Execução', 5, null::timestamptz, 'Etapa pedagógica prevista para início em agosto.'),
    ('Prestação de contas', 6, null::timestamptz, 'Etapa futura.')
) as stage(name, position, completed_at, notes);

with refens as (
  select id
  from public.projects
  where slug = 'formacao-artistas-rua-espetaculo-refens'
),
activities_seed (
  id,
  title,
  type,
  activity_date,
  start_time,
  end_time,
  location,
  responsible,
  description,
  status,
  notes
) as (
  values
    ('11111111-1111-1111-1111-000000000101', 'Acolhimento e integração', 'Aula', '2026-08-05'::date, '19:00'::time, '22:00'::time, 'Cia de Artes Viva', 'Direção executiva', 'Aula inicial de acolhimento e integração do grupo.', 'Realizada', 'Registrar presença e autorização de imagem.'),
    ('11111111-1111-1111-1111-000000000102', 'História do teatro e linguagens cênicas', 'Aula', '2026-08-08'::date, '19:00'::time, '22:00'::time, 'Cia de Artes Viva', 'Direção executiva', 'Base histórica e referências para o processo artístico.', 'Realizada', 'Inserir conteúdo programático no diário de classe.'),
    ('11111111-1111-1111-1111-000000000103', 'Leitura do roteiro Reféns', 'Aula', '2026-08-11'::date, '19:00'::time, '22:00'::time, 'Cia de Artes Viva', 'Direção executiva', 'Leitura e conversa sobre o roteiro do espetáculo.', 'Agendada', 'Pode ser remarcada conforme agenda do grupo.'),
    ('11111111-1111-1111-1111-000000000104', 'Corpo, expressão e presença', 'Aula', '2026-08-14'::date, '19:00'::time, '22:00'::time, 'Cia de Artes Viva', 'Direção executiva', 'Aquecimento corporal e presença cênica.', 'Agendada', 'Usar para certificação com conteúdo programado.'),
    ('11111111-1111-1111-1111-000000000105', 'Voz, respiração e projeção', 'Aula', '2026-08-17'::date, '19:00'::time, '22:00'::time, 'Cia de Artes Viva', 'Direção executiva', 'Trabalho de voz e articulação do elenco.', 'Agendada', 'Anexar fotos e lista de presença.'),
    ('11111111-1111-1111-1111-000000000106', 'Improvisação e jogo teatral', 'Aula', '2026-08-20'::date, '19:00'::time, '22:00'::time, 'Cia de Artes Viva', 'Direção executiva', 'Jogos teatrais e improvisação orientada.', 'Agendada', 'Aula formativa com foco em criação.'),
    ('11111111-1111-1111-1111-000000000107', 'Montagem das primeiras cenas', 'Ensaio', '2026-08-23'::date, '19:00'::time, '22:00'::time, 'Cia de Artes Viva', 'Direção executiva', 'Organização das primeiras cenas do espetáculo.', 'Agendada', 'Apoio para relatório parcial.'),
    ('11111111-1111-1111-1111-000000000108', 'Cenas centrais e ritmo', 'Ensaio', '2026-08-26'::date, '19:00'::time, '22:00'::time, 'Cia de Artes Viva', 'Direção executiva', 'Ajustes de ritmo e relação de cena.', 'Agendada', 'Usar para avaliação de frequência.'),
    ('11111111-1111-1111-1111-000000000109', 'Final, coro e cenas coletivas', 'Ensaio', '2026-08-29'::date, '19:00'::time, '22:00'::time, 'Cia de Artes Viva', 'Direção executiva', 'Fechamento de cenas coletivas.', 'Agendada', 'Gerar certificado com conteúdo programático.'),
    ('11111111-1111-1111-1111-000000000110', 'Ensaio corrido e ajustes de direção', 'Ensaio geral', '2026-09-01'::date, '19:00'::time, '22:00'::time, 'Cia de Artes Viva', 'Direção executiva', 'Ensaio corrido para alinhamento final.', 'Agendada', 'Etapa de revisão final da cena.'),
    ('11111111-1111-1111-1111-000000000111', 'Ensaio geral pedagógico e fechamento', 'Ensaio geral', '2026-09-04'::date, '19:00'::time, '22:00'::time, 'Cia de Artes Viva', 'Direção executiva', 'Fechamento pedagógico e documentação final.', 'Agendada', 'Encerrar com diário completo e certificado.')
)
insert into public.activities (
  id,
  project_id,
  title,
  type,
  activity_date,
  start_time,
  end_time,
  location,
  responsible,
  description,
  status,
  notes
)
select
  a.id,
  refens.id,
  a.title,
  a.type,
  a.activity_date,
  a.start_time,
  a.end_time,
  a.location,
  a.responsible,
  a.description,
  a.status,
  a.notes
from refens
cross join activities_seed as a;

with classes_seed (
  activity_id,
  class_number,
  theme,
  objective,
  content,
  practical_activities,
  expected_result,
  teacher,
  pedagogical_notes
) as (
  values
    ('11111111-1111-1111-1111-000000000101', 1, 'Acolhimento e integração', 'Integrar o grupo e apresentar o projeto.', 'Dinâmica de apresentação e combinados do grupo.', 'Roda de conversa e acolhimento.', 'Todos os participantes integrados.', 'Profissional responsável', 'Campo livre para observações pedagógicas.'),
    ('11111111-1111-1111-1111-000000000102', 2, 'História do teatro e linguagens cênicas', 'Apresentar referências cênicas.', 'Linha do tempo e movimentos teatrais.', 'Leitura e debate.', 'Ampliação de repertório.', 'Profissional responsável', 'Registrar referências discutidas.'),
    ('11111111-1111-1111-1111-000000000103', 3, 'Leitura do roteiro Reféns', 'Compreender a dramaturgia.', 'Leitura de texto e discussão de cenas.', 'Leitura guiada.', 'Primeiro contato com a obra.', 'Profissional responsável', 'Observar dúvidas e sugestões.'),
    ('11111111-1111-1111-1111-000000000104', 4, 'Corpo, expressão e presença', 'Trabalhar presença cênica.', 'Exercícios corporais e expressão.', 'Treino corporal.', 'Maior consciência do corpo em cena.', 'Profissional responsável', 'Anotar evolução individual.'),
    ('11111111-1111-1111-1111-000000000105', 5, 'Voz, respiração e projeção', 'Fortalecer voz e projeção.', 'Exercícios respiratórios e projeção vocal.', 'Prática vocal.', 'Expressividade e projeção adequadas.', 'Profissional responsável', 'Acompanhar articulação e ritmo.'),
    ('11111111-1111-1111-1111-000000000106', 6, 'Improvisação e jogo teatral', 'Estimular criação cênica.', 'Jogos e improvisação orientada.', 'Laboratório criativo.', 'Mais autonomia na cena.', 'Profissional responsável', 'Registrar respostas do grupo.'),
    ('11111111-1111-1111-1111-000000000107', 7, 'Montagem das primeiras cenas', 'Organizar blocos de cena.', 'Primeira construção de cenas.', 'Ensaio prático.', 'Cenas iniciais encaminhadas.', 'Profissional responsável', 'Guardar fotos de bastidores.'),
    ('11111111-1111-1111-1111-000000000108', 8, 'Cenas centrais e ritmo', 'Ajustar ritmo e transições.', 'Cenas centrais e continuidade.', 'Ensaio com marcação.', 'Ritmo cênico consistente.', 'Profissional responsável', 'Relacionar com diário de classe.'),
    ('11111111-1111-1111-1111-000000000109', 9, 'Final, coro e cenas coletivas', 'Fechar a estrutura dramática.', 'Fechamento coletivo e coro.', 'Ensaio coletivo.', 'Estrutura geral consolidada.', 'Profissional responsável', 'Pode gerar certificado parcial.'),
    ('11111111-1111-1111-1111-000000000110', 10, 'Ensaio corrido e ajustes de direção', 'Ajustar direção final.', 'Ensaio corrido do espetáculo.', 'Ensaio geral.', 'Correções de cena e fluxo.', 'Profissional responsável', 'Registrar notas da direção.'),
    ('11111111-1111-1111-1111-000000000111', 11, 'Ensaio geral pedagógico e fechamento', 'Fechar o ciclo formativo.', 'Síntese do processo e avaliação.', 'Avaliação final.', 'Documentação completa do percurso.', 'Profissional responsável', 'Finalização com lista de presença.')
)
insert into public.classes (
  activity_id,
  class_number,
  theme,
  objective,
  content,
  practical_activities,
  expected_result,
  teacher,
  pedagogical_notes
)
select
  c.activity_id,
  c.class_number,
  c.theme,
  c.objective,
  c.content,
  c.practical_activities,
  c.expected_result,
  c.teacher,
  c.pedagogical_notes
from classes_seed as c
;

with refens as (
  select id
  from public.projects
  where slug = 'formacao-artistas-rua-espetaculo-refens'
),
participants_seed (
  id,
  full_name,
  document,
  birth_date,
  phone,
  email,
  neighborhood,
  address,
  guardian_name,
  guardian_phone,
  image_authorization,
  participation_authorization,
  pedagogical_notes,
  status
) as (
  values
    ('11111111-1111-1111-1111-000000000201', 'Participante Reféns 01', '000.000.000-00', '2001-04-12'::date, '(48) 98888-1001', 'participante01@email.com', 'Centro', 'Rua das Artes, 100', null, null, true, true, 'Boa presença corporal nas atividades do projeto.', 'Ativo'),
    ('11111111-1111-1111-1111-000000000202', 'Participante Reféns 02', '000.000.000-00', '2007-09-20'::date, '(48) 98888-1002', 'participante02@email.com', 'Serraria', 'Rua da Cultura, 230', 'Responsável legal', '(48) 98888-2002', true, true, 'Menor de idade; manter autorização do responsável anexada.', 'Ativo'),
    ('11111111-1111-1111-1111-000000000203', 'Participante Reféns 03', null, '1998-02-03'::date, '(48) 98888-1003', null, 'Campinas', 'Avenida Viva, 45', null, null, false, true, 'Pendente autorização de imagem.', 'Selecionado')
)
insert into public.participants (
  id,
  project_id,
  full_name,
  document,
  birth_date,
  phone,
  email,
  neighborhood,
  address,
  guardian_name,
  guardian_phone,
  image_authorization,
  participation_authorization,
  pedagogical_notes,
  status
)
select
  p.id,
  refens.id,
  p.full_name,
  p.document,
  p.birth_date,
  p.phone,
  p.email,
  p.neighborhood,
  p.address,
  p.guardian_name,
  p.guardian_phone,
  p.image_authorization,
  p.participation_authorization,
  p.pedagogical_notes,
  p.status
from refens
cross join participants_seed as p;

with refens as (
  select id
  from public.projects
  where slug = 'formacao-artistas-rua-espetaculo-refens'
),
documents_seed (
  id,
  file_name,
  storage_path,
  category,
  uploaded_at,
  expires_at,
  notes,
  status
) as (
  values
    ('11111111-1111-1111-1111-000000000301', 'edital-principal-refens.pdf', 'storage/refens/edital-principal.pdf', 'Edital e anexos', '2026-06-19 12:00:00+00'::timestamptz, null::date, 'Edital principal do projeto Reféns.', 'Válido'),
    ('11111111-1111-1111-1111-000000000302', 'habilitacao-refens.pdf', 'storage/refens/habilitacao.pdf', 'Habilitação', '2026-06-19 12:00:00+00'::timestamptz, '2026-08-25'::date, 'Pasta de habilitação e certidões.', 'Válido'),
    ('11111111-1111-1111-1111-000000000303', 'lista-presenca-refens.docx', 'storage/refens/lista-presenca.docx', 'Lista de presença', '2026-06-19 12:00:00+00'::timestamptz, null::date, 'Modelo de diário de classe e presença.', 'Válido'),
    ('11111111-1111-1111-1111-000000000304', 'autorizacoes-imagem-refens.pdf', 'storage/refens/autorizacoes-imagem.pdf', 'Autorizações de imagem', '2026-06-19 12:00:00+00'::timestamptz, null::date, 'Autorizações e documentos de apoio do projeto.', 'Válido')
)
insert into public.documents (
  id,
  project_id,
  activity_id,
  participant_id,
  team_member_id,
  file_name,
  storage_path,
  category,
  uploaded_at,
  expires_at,
  notes,
  status
)
select
  d.id,
  refens.id,
  null::uuid,
  null::uuid,
  null::uuid,
  d.file_name,
  d.storage_path,
  d.category,
  d.uploaded_at,
  d.expires_at,
  d.notes,
  d.status
from refens
cross join documents_seed as d;

with refens as (
  select id
  from public.projects
  where slug = 'formacao-artistas-rua-espetaculo-refens'
),
budget_items_seed (
  id,
  category,
  name,
  approved_amount,
  executed_amount,
  notes
) as (
  values
    ('11111111-1111-1111-1111-000000000401', 'Direção executiva', 'Coordenação e direção', 6000::numeric(12,2), 700::numeric(12,2), 'Gestão geral, coordenação e direção executiva do projeto.'),
    ('11111111-1111-1111-1111-000000000402', 'Formação / oficinas', 'Oficinas e aulas', 13000::numeric(12,2), 3000::numeric(12,2), 'Aulas, oficinas, preparação pedagógica e conteúdo formativo.'),
    ('11111111-1111-1111-1111-000000000403', 'Atuação / elenco', 'Elenco e participação artística', 10000::numeric(12,2), 1500::numeric(12,2), 'Atuação, presença artística, ensaios e participação do elenco.'),
    ('11111111-1111-1111-1111-000000000404', 'Técnica e operação', 'Assistência técnica e operação', 8000::numeric(12,2), 1200::numeric(12,2), 'Som, luz, montagem, operação e suporte técnico.'),
    ('11111111-1111-1111-1111-000000000405', 'Registro fotográfico e vídeo', 'Registro e documentação visual', 5000::numeric(12,2), 1000::numeric(12,2), 'Fotos, vídeos, bastidores e comprovação documental.'),
    ('11111111-1111-1111-1111-000000000406', 'Divulgação e design', 'Comunicação visual', 4000::numeric(12,2), 500::numeric(12,2), 'Peças gráficas, identidade visual e divulgação do projeto.'),
    ('11111111-1111-1111-1111-000000000407', 'Transporte e logística', 'Deslocamento e apoio', 2000::numeric(12,2), 300::numeric(12,2), 'Transporte, logística e apoio operacional às atividades.'),
    ('11111111-1111-1111-1111-000000000408', 'Documentação e prestação de contas', 'Organização financeira', 1000::numeric(12,2), 200::numeric(12,2), 'Arquivamento, relatórios, anexos e prestação de contas.'),
    ('11111111-1111-1111-1111-000000000409', 'Acessibilidade', 'Recursos de acessibilidade', 1000::numeric(12,2), 0::numeric(12,2), 'Adequações e recursos de acesso conforme necessidade do projeto.')
)
insert into public.budget_items (
  id,
  project_id,
  category,
  name,
  approved_amount,
  executed_amount,
  notes
)
select
  b.id,
  refens.id,
  b.category,
  b.name,
  b.approved_amount,
  b.executed_amount,
  b.notes
from refens
cross join budget_items_seed as b;

with refens as (
  select id
  from public.projects
  where slug = 'formacao-artistas-rua-espetaculo-refens'
),
expenses_seed (
  id,
  budget_item_id,
  description,
  supplier,
  supplier_document,
  amount,
  paid_at,
  payment_method,
  receipt_document_id,
  invoice_document_id,
  status,
  notes
) as (
  values
    ('11111111-1111-1111-1111-000000000501', '11111111-1111-1111-1111-000000000403', 'Pagamento artístico - Reféns', 'Profissional pessoa física', '000.000.000-00', 4800::numeric(12,2), '2026-08-10'::date, 'PIX', '11111111-1111-1111-1111-000000000304', null::uuid, 'Pago', 'Recibo obrigatório quando o prestador não emitir nota fiscal.'),
    ('11111111-1111-1111-1111-000000000502', '11111111-1111-1111-1111-000000000405', 'Comprovação visual e materiais - Reféns', 'Fornecedor/prestador vinculado', '00.000.000/0001-00', 2200::numeric(12,2), '2026-08-18'::date, 'Transferência', '11111111-1111-1111-1111-000000000303', '11111111-1111-1111-1111-000000000302', 'Pago', 'Anexar nota fiscal, cupom fiscal ou recibo conforme o caso.'),
    ('11111111-1111-1111-1111-000000000503', '11111111-1111-1111-1111-000000000401', 'Organização financeira e documentação - Reféns', 'Direção executiva', '00.000.000/0001-00', 1500::numeric(12,2), '2026-08-22'::date, 'Transferência', '11111111-1111-1111-1111-000000000301', null::uuid, 'Pago', 'Registro de aprovação, transferência e arquivo financeiro do projeto.')
)
insert into public.expenses (
  id,
  project_id,
  budget_item_id,
  description,
  supplier,
  supplier_document,
  amount,
  paid_at,
  payment_method,
  receipt_document_id,
  invoice_document_id,
  status,
  notes
)
select
  e.id,
  refens.id,
  e.budget_item_id,
  e.description,
  e.supplier,
  e.supplier_document,
  e.amount,
  e.paid_at,
  e.payment_method,
  e.receipt_document_id,
  e.invoice_document_id,
  e.status,
  e.notes
from refens
cross join expenses_seed as e;

with refens as (
  select id
  from public.projects
  where slug = 'formacao-artistas-rua-espetaculo-refens'
),
official_documents_seed (
  id,
  template,
  title,
  code,
  document_date,
  subject,
  status,
  recipient,
  recipient_role,
  institution,
  signer_one,
  signer_one_role,
  signer_two,
  signer_two_role,
  content
) as (
  values
    ('11111111-1111-1111-1111-000000000601', 'Ofício', 'Solicitação de documentação - Reféns', 'OFC-000937/2026', '2026-06-19'::date, 'Documentação do projeto Reféns', 'Rascunho', 'Setor responsável', 'Comissão de análise', 'Circuito Catarinense de Cultura PNAB SC 2026', 'Eduardo', 'Diretor Presidente', 'Marcel', 'Diretor Executivo', 'Solicitamos a conferência dos documentos anexados para continuidade do projeto Reféns.'),
    ('11111111-1111-1111-1111-000000000602', 'Autorização de Imagem', 'Autorização de uso de imagem - Reféns', 'AUT-000937/2026', '2026-06-19'::date, 'Autorização para participantes', 'Rascunho', 'Participante do projeto', 'Aluno/participante', 'Cia de Artes Viva', 'Participante', 'Autorizante', 'Responsável legal', 'Quando menor de idade', 'Autorizo a utilização de imagem, voz e registro fotográfico para fins de divulgação, prestação de contas e memória institucional do projeto.')
)
insert into public.official_documents (
  id,
  project_id,
  template,
  title,
  code,
  document_date,
  subject,
  status,
  recipient,
  recipient_role,
  institution,
  signer_one,
  signer_one_role,
  signer_two,
  signer_two_role,
  content
)
select
  od.id,
  refens.id,
  od.template,
  od.title,
  od.code,
  od.document_date,
  od.subject,
  od.status,
  od.recipient,
  od.recipient_role,
  od.institution,
  od.signer_one,
  od.signer_one_role,
  od.signer_two,
  od.signer_two_role,
  od.content
from refens
cross join official_documents_seed as od;

with refens as (
  select id
  from public.projects
  where slug = 'formacao-artistas-rua-espetaculo-refens'
),
reports_seed (
  id,
  type,
  title,
  options,
  generated_at,
  status
) as (
  values
    ('11111111-1111-1111-1111-000000000701', 'Dossiê completo do projeto', 'Dossiê inicial - Reféns', '{"includes":["Documentos","Cronograma","Financeiro","Participantes"]}'::jsonb, '2026-06-18 12:00:00+00'::timestamptz, 'Rascunho'),
    ('11111111-1111-1111-1111-000000000702', 'Relatório financeiro', 'Execução financeira parcial - Reféns', '{"includes":["Rubricas","Despesas","Comprovantes"]}'::jsonb, '2026-08-20 12:00:00+00'::timestamptz, 'Gerado')
)
insert into public.reports (
  id,
  project_id,
  type,
  title,
  options,
  generated_at,
  status
)
select
  r.id,
  refens.id,
  r.type,
  r.title,
  r.options,
  r.generated_at,
  r.status
from refens
cross join reports_seed as r;
