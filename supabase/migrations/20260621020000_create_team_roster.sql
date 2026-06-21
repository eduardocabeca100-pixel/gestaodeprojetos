-- Create team roster table for global team members
create table public.team_roster (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text not null,
  phone text,
  email text,
  document text,
  bio text,
  avatar_url text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create assignment table for roster members to projects
create table public.team_roster_assignments (
  id uuid primary key default gen_random_uuid(),
  team_roster_id uuid not null references public.team_roster(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  expected_amount numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  payment_status text not null default 'Previsto',
  notes text,
  assigned_at timestamptz not null default now(),
  unique(team_roster_id, project_id)
);

-- Create indexes
create index team_roster_active_idx on public.team_roster(is_active);
create index team_roster_assignments_project_idx on public.team_roster_assignments(project_id);
create index team_roster_assignments_roster_idx on public.team_roster_assignments(team_roster_id);

-- Enable RLS
alter table public.team_roster enable row level security;
alter table public.team_roster_assignments enable row level security;

-- RLS Policies
create policy "Everyone can view team roster"
  on public.team_roster for select
  using (true);

create policy "Only authenticated users can insert team roster"
  on public.team_roster for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update own team roster"
  on public.team_roster for update
  using (auth.role() = 'authenticated');

create policy "Everyone can view team roster assignments"
  on public.team_roster_assignments for select
  using (true);

create policy "Only authenticated users can manage team roster assignments"
  on public.team_roster_assignments for all
  using (auth.role() = 'authenticated');
