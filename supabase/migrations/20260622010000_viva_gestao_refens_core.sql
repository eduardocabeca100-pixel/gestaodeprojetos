create extension if not exists "pgcrypto";

create table if not exists public.viva_projects (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  short_name text not null,
  official_title text not null,
  proponent text,
  project_class text,
  cultural_area text,
  object_text text,
  locations text,
  duration_text text,
  budget_total numeric(12,2) default 0,
  accessibility_text text,
  audience_text text,
  status text default 'ativo',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.viva_team_members (
  id uuid primary key default gen_random_uuid(),
  external_key text unique,
  full_name text not null,
  display_name text,
  profile_type text default 'Artista',
  role text,
  cpf text,
  rg text,
  cnpj text,
  birth_date date,
  address text,
  city_uf text,
  email text,
  phone text,
  pix_key text,
  bank_info text,
  portfolio_url text,
  notes text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.viva_project_team (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.viva_projects(id) on delete cascade,
  team_member_id uuid references public.viva_team_members(id) on delete set null,
  role text,
  profile_type text,
  rubric text,
  expected_amount numeric(12,2) default 0,
  paid_amount numeric(12,2) default 0,
  payment_status text default 'Previsto',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(project_id, team_member_id)
);

create table if not exists public.viva_project_team_costs (
  id uuid primary key default gen_random_uuid(),
  project_team_id uuid references public.viva_project_team(id) on delete cascade,
  category text,
  rubric text not null,
  unit text,
  quantity text,
  unit_amount numeric(12,2),
  total_amount numeric(12,2) default 0,
  payment_basis text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists public.viva_project_payments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.viva_projects(id) on delete cascade,
  project_team_id uuid references public.viva_project_team(id) on delete set null,
  rubric text,
  amount numeric(12,2) not null default 0,
  paid_at date default current_date,
  note text,
  receipt_document_id uuid,
  created_at timestamptz default now()
);

create table if not exists public.viva_project_rubrics (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.viva_projects(id) on delete cascade,
  category text,
  name text not null,
  unit text,
  quantity text,
  payment_basis text,
  approved_amount numeric(12,2) default 0,
  executed_amount numeric(12,2) default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.viva_project_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.viva_projects(id) on delete cascade,
  title text not null,
  stage text,
  assignee text,
  due_date date,
  status text default 'Pendente',
  created_at timestamptz default now()
);

create table if not exists public.viva_project_pending_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.viva_projects(id) on delete cascade,
  title text not null,
  type text,
  due_date date,
  priority text default 'Média',
  status text default 'Pendente',
  created_at timestamptz default now()
);

create table if not exists public.viva_project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.viva_projects(id) on delete cascade,
  name text not null,
  original_name text,
  category text,
  storage_path text,
  mime_type text,
  size_bytes bigint,
  notes text,
  uploaded_at timestamptz default now()
);

create table if not exists public.viva_pdf_settings (
  id uuid primary key default gen_random_uuid(),
  user_key text unique default 'default',
  system_title text,
  company_name text,
  subtitle text,
  cnpj text,
  city_uf text,
  email text,
  phone text,
  site text,
  footer_text text,
  footer_site text,
  primary_color text,
  title_color text,
  body_text_color text,
  logo_path text,
  updated_at timestamptz default now()
);

insert into public.viva_projects (
  slug,
  short_name,
  official_title,
  proponent,
  project_class,
  cultural_area,
  object_text,
  locations,
  duration_text,
  budget_total,
  accessibility_text,
  audience_text,
  status
)
values (
  'refens',
  'Reféns',
  'Formação de Artistas de Rua e Montagem do Espetáculo “Reféns”',
  'Marcel Eduardo Cabeça Domingues (MEI)',
  'Classe II – Pessoa Jurídica (MEI)',
  'A – Artes Cênicas (Teatro) + K – Gestão e Mediação Cultural',
  'Realização de 11 ações de qualificação, aulas práticas e teóricas de teatro, para 12 novos artistas em situação de vulnerabilidade e 6 artistas experientes. Ao final, será montado e apresentado o espetáculo Reféns em 3 apresentações gratuitas.',
  'Teatro do CEU – Jaraguá do Sul e 2 apresentações em espaço público de rua/praça.',
  '11 aulas de 3 horas cada; 3 apresentações gratuitas com duração aproximada de 1 hora cada.',
  50000.00,
  'Intérprete de LIBRAS nas 3 apresentações, materiais com QR Code e linguagem simples, workshop de inclusão e rubricas de acessibilidade.',
  '12 novos artistas + 6 artistas experientes; estimativa de público de 600 pessoas.',
  'ativo'
)
on conflict (slug) do update set
  short_name = excluded.short_name,
  official_title = excluded.official_title,
  proponent = excluded.proponent,
  project_class = excluded.project_class,
  cultural_area = excluded.cultural_area,
  object_text = excluded.object_text,
  locations = excluded.locations,
  duration_text = excluded.duration_text,
  budget_total = excluded.budget_total,
  accessibility_text = excluded.accessibility_text,
  audience_text = excluded.audience_text,
  updated_at = now();

insert into public.viva_pdf_settings (
  user_key,
  system_title,
  company_name,
  subtitle,
  city_uf,
  email,
  phone,
  site,
  footer_text,
  footer_site,
  primary_color,
  title_color,
  body_text_color
)
values (
  'default',
  'SISTEMA DE GESTÃO DE PROJETOS',
  'Cia de Artes Viva',
  'Gestão de Projetos Culturais, Artísticos e Administrativos',
  'Jaraguá do Sul | SC',
  'eduardo@ciaviva.com',
  '(47) 992747545',
  'www.ciaviva.com',
  'SISTEMA DE GESTÃO DE PROJETOS • CIA DE ARTES VIVA • V2026',
  'WWW.CIAVIVA.COM',
  '#2f6b2f',
  '#173819',
  '#1f2933'
)
on conflict (user_key) do update set
  system_title = excluded.system_title,
  company_name = excluded.company_name,
  subtitle = excluded.subtitle,
  city_uf = excluded.city_uf,
  email = excluded.email,
  phone = excluded.phone,
  site = excluded.site,
  footer_text = excluded.footer_text,
  footer_site = excluded.footer_site,
  primary_color = excluded.primary_color,
  title_color = excluded.title_color,
  body_text_color = excluded.body_text_color,
  updated_at = now();

with project_refens as (
  select id from public.viva_projects where slug = 'refens'
),
members as (
  insert into public.viva_team_members (external_key, full_name, display_name, profile_type, role, cpf, cnpj, city_uf, email, phone, notes)
  values
    ('refens-marcel-eduardo', 'Marcel Eduardo Cabeça Domingues', 'Marcel Eduardo', 'Artista', 'Formador, diretor, ator e produtor', '112.656.749-30', '59.053.899/0001-53', 'Jaraguá do Sul | SC', 'eduardo@ciaviva.com', '(47) 992747545', 'Proponente, diretor geral, formador, produtor e ator do projeto Reféns.'),
    ('refens-kaique-varela', 'Kaique Varela Zaluski', 'Kaique Varela', 'Produção', 'Direção executiva / Produção executiva', null, '55.069.179/0001-25', 'Jaraguá do Sul | SC', null, null, 'Produção executiva do projeto.'),
    ('refens-jones-andre', 'Jones Alves Pereira', 'Jones André', 'Equipe técnica', 'Técnico de som', '041.409.299-60', null, 'Jaraguá do Sul | SC', null, null, 'Técnico de som.'),
    ('refens-cassius-venera', 'Cassius András Goetzke Venera', 'Cassius Venera', 'Equipe técnica', 'Técnico de iluminação', '072.327.099-60', null, 'Jaraguá do Sul | SC', null, null, 'Técnico de luz.'),
    ('refens-andre-brito', 'André Felipe de Mila Brito', 'André Brito', 'Equipe técnica', 'Registro audiovisual / fotográfico', '094.289.049', null, 'Jaraguá do Sul | SC', null, null, 'Fotógrafo / registro audiovisual.'),
    ('refens-suzi-daiane', 'Suzi Daiane', 'Suzi Daiane', 'Formação', 'Professora de inclusão, LIBRAS e acessibilidade', null, null, 'Jaraguá do Sul | SC', null, null, 'Inclusão, LIBRAS, audiodescrição, acessibilidade teatral e formação.'),
    ('refens-katiana-souza', 'Katiana de Souza Coelho', 'Katy Souza', 'Formação', 'Professora de técnica vocal / Tecladista / Música', '052.660.544-84', null, 'Jaraguá do Sul | SC', null, null, 'Técnica vocal e música.'),
    ('refens-renaldo-boddemberg', 'Renaldo Boddenberg', 'Renaldo Boddemberg', 'Artista', 'Ator experiente', '053.604.009-51', null, 'Jaraguá do Sul | SC', null, null, 'Ator experiente.'),
    ('refens-bruna-lazzarotto', 'Bruna Lazzarotto', 'Bruna Lazzarotto', 'Artista', 'Atriz experiente', null, null, 'Jaraguá do Sul | SC', null, null, 'Atriz experiente.'),
    ('refens-wemerson-goncalves', 'Wemerson Gonçalves', 'Wemerson Gonçalves', 'Artista', 'Ator experiente', null, null, 'Jaraguá do Sul | SC', null, null, 'Ator experiente.'),
    ('refens-julia-titz', 'Julia Titz', 'Julia Titz', 'Artista', 'Atriz experiente', '124.713.399-05', null, 'Jaraguá do Sul | SC', null, null, 'Atriz experiente.'),
    ('refens-karim-kamada', 'Karin Kamada', 'Karin Kamada', 'Artista', 'Artista / Atriz experiente', '182.841.878-17', null, 'Jaraguá do Sul | SC', null, null, 'Artista experiente.')
  on conflict (external_key) do update set
    full_name = excluded.full_name,
    display_name = excluded.display_name,
    profile_type = excluded.profile_type,
    role = excluded.role,
    cpf = excluded.cpf,
    cnpj = excluded.cnpj,
    city_uf = excluded.city_uf,
    email = excluded.email,
    phone = excluded.phone,
    notes = excluded.notes,
    updated_at = now()
  returning id, external_key
)
select 1;

insert into public.viva_team_members (external_key, full_name, display_name, profile_type, role, city_uf, notes)
select
  'refens-aluno-' || lpad(gs::text, 2, '0'),
  'Aluno novo ' || lpad(gs::text, 2, '0'),
  'Aluno novo ' || lpad(gs::text, 2, '0'),
  'Artista',
  'Artista em formação',
  'Jaraguá do Sul | SC',
  'Aluno novo a ser selecionado nas inscrições. Editar nome após seleção.'
from generate_series(1,12) gs
on conflict (external_key) do nothing;

with p as (
  select id project_id from public.viva_projects where slug = 'refens'
),
team_map as (
  select id team_member_id, external_key from public.viva_team_members
  where external_key like 'refens-%'
),
seed as (
  select * from (values
    ('refens-marcel-eduardo', 'Formador, diretor, ator e produtor', 'Artista', 'Diretor geral + produtor / Professor formador / Ator experiente', 8900.00, 'Composição: diretor geral + produtor R$ 6.000,00; professor/formador R$ 2.000,00; ator experiente R$ 900,00.'),
    ('refens-kaique-varela', 'Direção executiva / Produção executiva', 'Produção', 'Produção executiva', 6000.00, 'Composição: produção executiva R$ 6.000,00.'),
    ('refens-jones-andre', 'Técnico de som', 'Equipe técnica', 'Técnico de som', 1500.00, 'Composição: 3 apresentações x R$ 500,00.'),
    ('refens-cassius-venera', 'Técnico de iluminação', 'Equipe técnica', 'Técnico de iluminação', 500.00, 'Composição: serviço de técnico de iluminação R$ 500,00.'),
    ('refens-andre-brito', 'Registro audiovisual / fotográfico', 'Equipe técnica', 'Registro fotográfico', 2000.00, 'Composição: registro fotográfico/audiovisual R$ 2.000,00.'),
    ('refens-suzi-daiane', 'Professora de inclusão, LIBRAS e acessibilidade', 'Formação', 'Acessibilidade / LIBRAS / Capacitação', 2200.00, 'Composição: intérprete de LIBRAS R$ 1.200,00; capacitação de equipe R$ 1.000,00.'),
    ('refens-katiana-souza', 'Professora de técnica vocal / Tecladista / Música', 'Formação', 'Técnica vocal / Tecladista / Músico', 2300.00, 'Composição: tecladista/músico R$ 1.000,00; técnica vocal R$ 1.300,00.'),
    ('refens-renaldo-boddemberg', 'Ator experiente', 'Artista', 'Ator experiente', 900.00, 'Composição: 3 apresentações x R$ 300,00.'),
    ('refens-bruna-lazzarotto', 'Atriz experiente', 'Artista', 'Ator experiente', 900.00, 'Composição: 3 apresentações x R$ 300,00.'),
    ('refens-wemerson-goncalves', 'Ator experiente', 'Artista', 'Ator experiente', 900.00, 'Composição: 3 apresentações x R$ 300,00.'),
    ('refens-julia-titz', 'Atriz experiente', 'Artista', 'Ator experiente', 900.00, 'Composição: 3 apresentações x R$ 300,00.'),
    ('refens-karim-kamada', 'Artista / Atriz experiente', 'Artista', 'Ator experiente', 900.00, 'Composição: 3 apresentações x R$ 300,00.')
  ) as t(external_key, role, profile_type, rubric, expected_amount, notes)
),
inserted_project_team as (
  insert into public.viva_project_team (project_id, team_member_id, role, profile_type, rubric, expected_amount, paid_amount, payment_status, notes)
  select p.project_id, tm.team_member_id, s.role, s.profile_type, s.rubric, s.expected_amount, 0, 'Previsto', s.notes
  from p, seed s
  join team_map tm on tm.external_key = s.external_key
  on conflict (project_id, team_member_id) do update set
    role = excluded.role,
    profile_type = excluded.profile_type,
    rubric = excluded.rubric,
    expected_amount = excluded.expected_amount,
    notes = excluded.notes,
    updated_at = now()
  returning id, team_member_id
)
select 1;

with p as (
  select id project_id from public.viva_projects where slug = 'refens'
),
tm as (
  select id team_member_id, external_key from public.viva_team_members
  where external_key like 'refens-aluno-%'
)
insert into public.viva_project_team (project_id, team_member_id, role, profile_type, rubric, expected_amount, paid_amount, payment_status, notes)
select p.project_id, tm.team_member_id, 'Artista em formação', 'Artista', 'Alunos novos', 150.00, 0, 'Previsto', 'Composição: 3 apresentações x R$ 50,00. Editar nome após seleção.'
from p, tm
on conflict (project_id, team_member_id) do update set
  role = excluded.role,
  profile_type = excluded.profile_type,
  rubric = excluded.rubric,
  expected_amount = excluded.expected_amount,
  notes = excluded.notes,
  updated_at = now();

with pt as (
  select
    pt.id project_team_id,
    tm.external_key
  from public.viva_project_team pt
  join public.viva_projects p on p.id = pt.project_id and p.slug = 'refens'
  join public.viva_team_members tm on tm.id = pt.team_member_id
),
costs as (
  select * from (values
    ('refens-marcel-eduardo', 'Pré-produção', 'Diretor geral + produtor', '01 projeto', '01', 6000.00, 6000.00, 'Por projeto', 'Direção geral e produção.'),
    ('refens-marcel-eduardo', 'Pré-produção', 'Professor / formador', '01 projeto', '01', 2000.00, 2000.00, 'Por projeto', 'Formação teatral.'),
    ('refens-marcel-eduardo', 'Produção/Execução', 'Ator experiente', '03 apresentações', '01 ator', 300.00, 900.00, 'R$ 300,00 por apresentação', 'Atuação em 3 apresentações.'),
    ('refens-kaique-varela', 'Pré-produção', 'Produção executiva', '01 projeto', '01', 6000.00, 6000.00, 'Por projeto', 'Produção executiva.'),
    ('refens-jones-andre', 'Produção/Execução', 'Técnico de som', '03 apresentações', '01 profissional', 500.00, 1500.00, 'R$ 500,00 por apresentação', 'Som nas apresentações.'),
    ('refens-cassius-venera', 'Produção/Execução', 'Técnico de iluminação', '01 serviço', '01 profissional', 500.00, 500.00, 'Por serviço', 'Iluminação.'),
    ('refens-andre-brito', 'Produção/Execução', 'Registro fotográfico', '01 projeto', '01 profissional', 2000.00, 2000.00, 'Por projeto', 'Registro fotográfico/audiovisual.'),
    ('refens-suzi-daiane', 'Acessibilidade', 'Intérprete de LIBRAS', '03 apresentações', '01 intérprete', 400.00, 1200.00, 'R$ 400,00 por apresentação', 'LIBRAS nas apresentações.'),
    ('refens-suzi-daiane', 'Acessibilidade', 'Capacitação de equipe', '01 capacitação', '01 profissional', 1000.00, 1000.00, 'Por capacitação', 'Workshop de inclusão/acessibilidade.'),
    ('refens-katiana-souza', 'Produção/Execução', 'Tecladista / músico', '03 apresentações', '01 músico', 1000.00, 1000.00, 'Por projeto/apresentações', 'Música e teclado.'),
    ('refens-katiana-souza', 'Produção/Execução', 'Técnica vocal', '01 projeto', '01 profissional', 1300.00, 1300.00, 'Por projeto', 'Preparação vocal.')
  ) as t(external_key, category, rubric, unit, quantity, unit_amount, total_amount, payment_basis, notes)
)
insert into public.viva_project_team_costs (project_team_id, category, rubric, unit, quantity, unit_amount, total_amount, payment_basis, notes)
select pt.project_team_id, c.category, c.rubric, c.unit, c.quantity, c.unit_amount, c.total_amount, c.payment_basis, c.notes
from costs c
join pt on pt.external_key = c.external_key
where not exists (
  select 1 from public.viva_project_team_costs existing
  where existing.project_team_id = pt.project_team_id
  and existing.rubric = c.rubric
);

with actor_team as (
  select pt.id project_team_id
  from public.viva_project_team pt
  join public.viva_projects p on p.id = pt.project_id and p.slug = 'refens'
  join public.viva_team_members tm on tm.id = pt.team_member_id
  where tm.external_key in (
    'refens-renaldo-boddemberg',
    'refens-bruna-lazzarotto',
    'refens-wemerson-goncalves',
    'refens-julia-titz',
    'refens-karim-kamada'
  )
)
insert into public.viva_project_team_costs (project_team_id, category, rubric, unit, quantity, unit_amount, total_amount, payment_basis, notes)
select project_team_id, 'Produção/Execução', 'Ator experiente', '03 apresentações', '01 ator', 300.00, 900.00, 'R$ 300,00 por apresentação', 'Ator experiente em 3 apresentações.'
from actor_team
where not exists (
  select 1 from public.viva_project_team_costs c
  where c.project_team_id = actor_team.project_team_id
  and c.rubric = 'Ator experiente'
);

with student_team as (
  select pt.id project_team_id
  from public.viva_project_team pt
  join public.viva_projects p on p.id = pt.project_id and p.slug = 'refens'
  join public.viva_team_members tm on tm.id = pt.team_member_id
  where tm.external_key like 'refens-aluno-%'
)
insert into public.viva_project_team_costs (project_team_id, category, rubric, unit, quantity, unit_amount, total_amount, payment_basis, notes)
select project_team_id, 'Produção/Execução', 'Alunos novos', '03 apresentações', '01 aluno', 50.00, 150.00, 'R$ 50,00 por apresentação', 'Aluno novo formado nas aulas e integrado ao elenco.'
from student_team
where not exists (
  select 1 from public.viva_project_team_costs c
  where c.project_team_id = student_team.project_team_id
  and c.rubric = 'Alunos novos'
);

with p as (select id project_id from public.viva_projects where slug = 'refens')
insert into public.viva_project_rubrics (project_id, category, name, unit, quantity, payment_basis, approved_amount, executed_amount, notes)
select p.project_id, category, name, unit, quantity, payment_basis, approved_amount, 0, notes
from p, (values
  ('Pré-produção', 'Diretor geral + produtor', '01 projeto', '01', 'Por projeto', 6000.00, 'Pré-produção.'),
  ('Pré-produção', 'Professor / formador', '01 projeto', '01', 'Por projeto', 2000.00, 'Formação teatral.'),
  ('Pré-produção', 'Produção executiva', '01 projeto', '01', 'Por projeto', 6000.00, 'Produção executiva.'),
  ('Produção/Execução', 'Ator experiente', '03 apresentações', '06 atores', 'R$ 300,00 por ator por apresentação', 5400.00, '6 atores experientes em 3 apresentações.'),
  ('Produção/Execução', 'Alunos novos', '03 apresentações', '12 alunos', 'R$ 50,00 por aluno por apresentação', 1800.00, '12 alunos novos.'),
  ('Produção/Execução', 'Técnico de som', '03 apresentações', '01 profissional', 'R$ 500,00 por apresentação', 1500.00, 'Som.'),
  ('Produção/Execução', 'Técnico de iluminação', '01 serviço', '01 profissional', 'Por serviço', 500.00, 'Luz.'),
  ('Produção/Execução', 'Tecladista / músico', '03 apresentações', '01 músico', 'Por projeto/apresentações', 1000.00, 'Música.'),
  ('Produção/Execução', 'Figurino e maquiagem', '01 projeto', '01 conjunto', 'Por projeto', 4500.00, 'Figurino e maquiagem.'),
  ('Produção/Execução', 'Cenografia', '01 projeto', '01 cenário', 'Por projeto', 1500.00, 'Cenografia.'),
  ('Produção/Execução', 'Material de divulgação', '01 projeto', '01 campanha', 'Por campanha', 1800.00, 'Divulgação.'),
  ('Produção/Execução', 'Transporte e logística', '01 projeto', '01 operação', 'Por projeto', 1000.00, 'Logística.'),
  ('Produção/Execução', 'Lanche / alunos e equipe', '01 projeto', '01 fornecimento', 'Por projeto', 3500.00, 'Alimentação.'),
  ('Produção/Execução', 'Sonorização', '02 serviços', '01 fornecedor', 'Por serviço', 3000.00, 'Sonorização.'),
  ('Produção/Execução', 'Registro fotográfico', '01 projeto', '01 profissional', 'Por projeto', 2000.00, 'Registro.'),
  ('Produção/Execução', 'Técnica vocal', '01 projeto', '01 profissional', 'Por projeto', 1300.00, 'Voz.'),
  ('Acessibilidade', 'Intérprete de LIBRAS', '03 apresentações', '01 intérprete', 'R$ 400,00 por apresentação', 1200.00, 'LIBRAS.'),
  ('Acessibilidade', 'Capacitação de equipe', '01 capacitação', '01 profissional', 'Por capacitação', 1000.00, 'Capacitação.'),
  ('Acessibilidade', 'Espaço para capacitação', '01 espaço', '01', 'Por uso', 500.00, 'Espaço.'),
  ('Acessibilidade', 'Materiais acessíveis', '01 projeto', '01 conjunto', 'Por projeto', 2300.00, 'Materiais acessíveis.'),
  ('Pós-produção', 'Prestação de contas', '01 projeto', '01', 'Por projeto', 1000.00, 'Prestação de contas.'),
  ('Pós-produção', 'Contingências / imprevistos', '01 projeto', '01 reserva', 'Conforme necessidade', 1200.00, 'Imprevistos.')
) as r(category, name, unit, quantity, payment_basis, approved_amount, notes)
where not exists (
  select 1 from public.viva_project_rubrics existing
  where existing.project_id = p.project_id
  and existing.name = r.name
);


-- VIVA REFENS OFFICIAL COST BREAKDOWN PATCH
-- Mantém as composições oficiais de valor por integrante do projeto Reféns.
-- Não lança pagamento: paid_amount/executed_amount continuam zerados até movimentação real.

update public.viva_project_team
set paid_amount = 0,
    payment_status = 'Previsto',
    updated_at = now()
where project_id = (select id from public.viva_projects where slug = 'refens')
and coalesce(paid_amount, 0) = 0;

