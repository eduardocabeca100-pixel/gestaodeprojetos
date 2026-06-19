create extension if not exists "pgcrypto";

create type public.app_role as enum (
  'admin',
  'super_admin',
  'diretor_executivo',
  'financeiro',
  'editor_projeto',
  'equipe_tecnica',
  'visualizador'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null unique,
  role public.app_role not null default 'visualizador',
  avatar_url text,
  is_active boolean not null default true,
  must_change_password boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  full_title text not null,
  slug text not null unique,
  short_description text,
  summary text,
  edital text,
  registration_number text,
  approved_amount numeric(12,2) not null default 0,
  executed_amount numeric(12,2) not null default 0,
  status text not null default 'Planejamento',
  current_stage text,
  modality text,
  class_name text,
  proponent text,
  proponent_document text,
  city text,
  state text,
  start_date date,
  end_date date,
  cover_url text,
  banner_url text,
  notes text,
  archived boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  position integer not null,
  completed_at timestamptz,
  notes text
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  activity_id uuid,
  participant_id uuid,
  team_member_id uuid,
  file_name text not null,
  storage_path text not null,
  category text not null,
  uploaded_by uuid references public.profiles(id),
  uploaded_at timestamptz not null default now(),
  expires_at date,
  notes text,
  status text not null default 'Pendente',
  archived boolean not null default false
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  activity_id uuid,
  title text not null,
  type text not null,
  registered_at date,
  location text,
  description text,
  storage_path text,
  external_url text,
  category text not null,
  selected_for_dossier boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  type text not null,
  activity_date date not null,
  start_time time,
  end_time time,
  location text,
  responsible text,
  description text,
  status text not null default 'Agendada',
  notes text,
  created_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  class_number integer not null,
  theme text not null,
  objective text,
  content text,
  practical_activities text,
  expected_result text,
  teacher text,
  pedagogical_notes text
);

create table public.participants (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  full_name text not null,
  document text,
  birth_date date,
  phone text,
  email text,
  neighborhood text,
  address text,
  guardian_name text,
  guardian_phone text,
  image_authorization boolean not null default false,
  participation_authorization boolean not null default false,
  pedagogical_notes text,
  status text not null default 'Inscrito',
  created_at timestamptz not null default now()
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.activities(id) on delete cascade,
  participant_id uuid not null references public.participants(id) on delete cascade,
  present boolean not null default false,
  notes text,
  unique(activity_id, participant_id)
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  role text not null,
  phone text,
  email text,
  document text,
  expected_amount numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  payment_status text not null default 'Previsto',
  notes text,
  created_at timestamptz not null default now()
);

create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  category text not null,
  name text not null,
  approved_amount numeric(12,2) not null default 0,
  executed_amount numeric(12,2) not null default 0,
  notes text
);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  budget_item_id uuid not null references public.budget_items(id) on delete restrict,
  description text not null,
  supplier text,
  supplier_document text,
  amount numeric(12,2) not null default 0,
  paid_at date,
  payment_method text,
  receipt_document_id uuid references public.documents(id),
  invoice_document_id uuid references public.documents(id),
  status text not null default 'Previsto',
  notes text,
  created_at timestamptz not null default now()
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  type text not null,
  title text not null,
  options jsonb not null default '{}',
  storage_path text,
  generated_by uuid references public.profiles(id),
  generated_at timestamptz not null default now(),
  status text not null default 'Rascunho'
);

create table public.official_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  template text not null,
  title text not null,
  code text not null,
  document_date date not null default current_date,
  subject text,
  status text not null default 'Rascunho',
  recipient text,
  recipient_role text,
  institution text,
  signer_one text,
  signer_one_role text,
  signer_two text,
  signer_two_role text,
  content text not null,
  storage_path text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.certificate_templates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  primary_color text not null default '#1d4ed8',
  secondary_color text not null default '#7c3aed',
  title_color text not null default '#111827',
  border_color text not null default '#c7d2fe',
  border_enabled boolean not null default true,
  background_image_url text,
  logo_main_url text,
  logo_secondary_url text,
  footer_logos_enabled boolean not null default true,
  front_text text not null,
  conclusion_text text not null,
  back_title text not null,
  program_content text not null,
  workload text not null,
  city text not null,
  show_student_cpf boolean not null default true,
  show_workload_front boolean not null default true,
  show_modality boolean not null default true,
  show_project_name boolean not null default true,
  back_columns integer not null default 2,
  final_back_image_enabled boolean not null default false,
  final_back_image_url text,
  final_back_image_position text not null default 'centro',
  final_back_image_width numeric(10,2) not null default 52,
  final_back_image_height numeric(10,2) not null default 86,
  final_back_image_margin_top numeric(10,2) not null default 16,
  final_back_image_margin_bottom numeric(10,2) not null default 16,
  show_back_logos boolean not null default true,
  show_back_workload boolean not null default true,
  show_back_teacher boolean not null default true,
  show_back_registry boolean not null default true,
  show_back_book_folio boolean not null default true,
  show_back_signature boolean not null default true,
  page_orientation text not null default 'paisagem',
  margin_top numeric(10,2) not null default 24,
  margin_bottom numeric(10,2) not null default 24,
  margin_left numeric(10,2) not null default 28,
  margin_right numeric(10,2) not null default 28,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.certificate_signatures (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.certificate_templates(id) on delete cascade,
  name text not null,
  role text not null,
  signature_url text,
  "order" integer not null default 1,
  show_on_front boolean not null default true,
  show_on_back boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.certificate_sponsor_logos (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.certificate_templates(id) on delete cascade,
  name text not null,
  type text not null,
  logo_url text,
  "order" integer not null default 1,
  size numeric(10,2) not null default 28,
  show_on_front boolean not null default true,
  show_on_back boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.certificate_footer_logos (
  id uuid primary key default gen_random_uuid(),
  certificate_template_id uuid not null references public.certificate_templates(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  name text not null,
  category text not null,
  logo_url text,
  file_name text,
  file_type text,
  file_size bigint,
  image_width integer,
  image_height integer,
  display_width_mm numeric(10,2) not null default 32,
  max_height_mm numeric(10,2) not null default 16,
  position text not null default 'centro',
  display_order integer not null default 1,
  show_on_front boolean not null default true,
  show_on_back boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.certificate_back_final_images (
  id uuid primary key default gen_random_uuid(),
  certificate_template_id uuid not null references public.certificate_templates(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  image_url text,
  file_name text,
  file_type text,
  file_size bigint,
  image_width integer,
  image_height integer,
  display_width_percent integer not null default 80,
  max_height_mm numeric(10,2) not null default 35,
  position text not null default 'centro',
  margin_top_mm numeric(10,2) not null default 0,
  margin_bottom_mm numeric(10,2) not null default 0,
  keep_aspect_ratio boolean not null default true,
  show_on_pdf boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.certificate_footer_settings (
  id uuid primary key default gen_random_uuid(),
  certificate_template_id uuid not null references public.certificate_templates(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  footer_layout text not null default 'categorias',
  show_footer_front boolean not null default true,
  show_footer_back boolean not null default true,
  use_same_footer_on_back boolean not null default true,
  show_category_titles boolean not null default true,
  show_dividers boolean not null default true,
  logo_spacing numeric(10,2) not null default 14,
  footer_margin_top_mm numeric(10,2) not null default 6,
  footer_margin_bottom_mm numeric(10,2) not null default 6,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  template_id uuid not null references public.certificate_templates(id) on delete restrict,
  participant_id uuid not null references public.participants(id) on delete restrict,
  certificate_number text not null,
  student_name text not null,
  student_document text,
  course_name text not null,
  modality text not null,
  workload text not null,
  city text not null,
  issue_date date not null default current_date,
  status text not null default 'Rascunho',
  pdf_url text,
  generated_by uuid references public.profiles(id),
  generated_at timestamptz,
  canceled_at timestamptz,
  cancel_reason text,
  book text,
  folio text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id, certificate_number)
);

create table public.certificate_batches (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  template_id uuid not null references public.certificate_templates(id) on delete restrict,
  name text not null,
  total_certificates integer not null default 0,
  pdf_url text,
  zip_url text,
  generated_by uuid references public.profiles(id),
  generated_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.certificate_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.settings (
  id text primary key,
  value jsonb not null default '{}',
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table public.user_permissions (
  id uuid primary key default gen_random_uuid(),
  role public.app_role not null,
  permission text not null,
  enabled boolean not null default true,
  unique(role, permission)
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create or replace function public.current_profile_role()
returns public.app_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles
  where id = auth.uid() and is_active = true
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_profile_role() = 'admin'
$$;

create or replace function public.is_operator()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_profile_role() in ('admin', 'diretor_executivo')
$$;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_stages enable row level security;
alter table public.documents enable row level security;
alter table public.media enable row level security;
alter table public.activities enable row level security;
alter table public.classes enable row level security;
alter table public.participants enable row level security;
alter table public.attendance enable row level security;
alter table public.team_members enable row level security;
alter table public.budget_items enable row level security;
alter table public.expenses enable row level security;
alter table public.reports enable row level security;
alter table public.official_documents enable row level security;
alter table public.settings enable row level security;
alter table public.user_permissions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.certificate_templates enable row level security;
alter table public.certificate_signatures enable row level security;
alter table public.certificate_sponsor_logos enable row level security;
alter table public.certificate_footer_logos enable row level security;
alter table public.certificate_back_final_images enable row level security;
alter table public.certificate_footer_settings enable row level security;
alter table public.certificates enable row level security;
alter table public.certificate_batches enable row level security;
alter table public.certificate_settings enable row level security;

create policy "profiles read own or admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "profiles admin writes" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

create policy "operators read projects" on public.projects
  for select using (public.is_operator());
create policy "operators write projects" on public.projects
  for insert with check (public.is_operator());
create policy "operators update projects" on public.projects
  for update using (public.is_operator()) with check (public.is_operator());
create policy "admin delete projects" on public.projects
  for delete using (public.is_admin());

create policy "operators read project children" on public.project_stages
  for select using (public.is_operator());
create policy "operators write project children" on public.project_stages
  for all using (public.is_operator()) with check (public.is_operator());

create policy "operators read documents" on public.documents
  for select using (public.is_operator());
create policy "operators write documents" on public.documents
  for all using (public.is_operator()) with check (public.is_operator());

create policy "operators read media" on public.media
  for select using (public.is_operator());
create policy "operators write media" on public.media
  for all using (public.is_operator()) with check (public.is_operator());

create policy "operators read activities" on public.activities
  for select using (public.is_operator());
create policy "operators write activities" on public.activities
  for all using (public.is_operator()) with check (public.is_operator());

create policy "operators read classes" on public.classes
  for select using (public.is_operator());
create policy "operators write classes" on public.classes
  for all using (public.is_operator()) with check (public.is_operator());

create policy "operators read participants" on public.participants
  for select using (public.is_operator());
create policy "operators write participants" on public.participants
  for all using (public.is_operator()) with check (public.is_operator());

create policy "operators read attendance" on public.attendance
  for select using (public.is_operator());
create policy "operators write attendance" on public.attendance
  for all using (public.is_operator()) with check (public.is_operator());

create policy "operators read team" on public.team_members
  for select using (public.is_operator());
create policy "operators write team" on public.team_members
  for all using (public.is_operator()) with check (public.is_operator());

create policy "operators read budget" on public.budget_items
  for select using (public.is_operator());
create policy "operators write budget" on public.budget_items
  for all using (public.is_operator()) with check (public.is_operator());

create policy "operators read expenses" on public.expenses
  for select using (public.is_operator());
create policy "operators write expenses" on public.expenses
  for all using (public.is_operator()) with check (public.is_operator());

create policy "operators read reports" on public.reports
  for select using (public.is_operator());
create policy "operators write reports" on public.reports
  for all using (public.is_operator()) with check (public.is_operator());

create policy "operators read official documents" on public.official_documents
  for select using (public.is_operator());
create policy "operators write official documents" on public.official_documents
  for all using (public.is_operator()) with check (public.is_operator());

create policy "operators read settings" on public.settings
  for select using (public.is_operator());
create policy "admin writes sensitive settings" on public.settings
  for all using (public.is_admin()) with check (public.is_admin());

create policy "admin permissions" on public.user_permissions
  for all using (public.is_admin()) with check (public.is_admin());

create policy "operators read audit logs" on public.audit_logs
  for select using (public.is_operator());
create policy "system inserts audit logs" on public.audit_logs
  for insert with check (auth.uid() = user_id or public.is_admin());

create policy "operators read certificate templates" on public.certificate_templates
  for select using (public.is_operator());
create policy "operators write certificate templates" on public.certificate_templates
  for all using (public.is_operator()) with check (public.is_operator());
create policy "admin delete certificate templates" on public.certificate_templates
  for delete using (public.is_admin());

create policy "operators read certificate signatures" on public.certificate_signatures
  for select using (public.is_operator());
create policy "operators write certificate signatures" on public.certificate_signatures
  for all using (public.is_operator()) with check (public.is_operator());

create policy "operators read certificate sponsor logos" on public.certificate_sponsor_logos
  for select using (public.is_operator());
create policy "operators write certificate sponsor logos" on public.certificate_sponsor_logos
  for all using (public.is_operator()) with check (public.is_operator());

create policy "operators read certificate footer logos" on public.certificate_footer_logos
  for select using (public.is_operator());
create policy "operators write certificate footer logos" on public.certificate_footer_logos
  for all using (public.is_operator()) with check (public.is_operator());

create policy "operators read certificate back images" on public.certificate_back_final_images
  for select using (public.is_operator());
create policy "operators write certificate back images" on public.certificate_back_final_images
  for all using (public.is_operator()) with check (public.is_operator());

create policy "operators read certificate footer settings" on public.certificate_footer_settings
  for select using (public.is_operator());
create policy "operators write certificate footer settings" on public.certificate_footer_settings
  for all using (public.is_operator()) with check (public.is_operator());

create policy "operators read certificates" on public.certificates
  for select using (public.is_operator());
create policy "operators write certificates" on public.certificates
  for all using (public.is_operator()) with check (public.is_operator());

create policy "operators read certificate batches" on public.certificate_batches
  for select using (public.is_operator());
create policy "operators write certificate batches" on public.certificate_batches
  for all using (public.is_operator()) with check (public.is_operator());

create policy "operators read certificate settings" on public.certificate_settings
  for select using (public.is_operator());
create policy "operators write certificate settings" on public.certificate_settings
  for all using (public.is_operator()) with check (public.is_operator());
