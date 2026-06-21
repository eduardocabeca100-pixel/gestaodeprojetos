create table if not exists public.project_memberships (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, project_id)
);

create index if not exists project_memberships_project_id_idx
  on public.project_memberships(project_id);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_profile_role() in ('admin', 'super_admin')
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_profile_role() = 'super_admin'
$$;

create or replace function public.is_operator()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.current_profile_role() in ('admin', 'super_admin')
$$;

create or replace function public.can_access_project(target_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_operator() or exists (
    select 1
    from public.project_memberships membership
    where membership.profile_id = auth.uid()
      and membership.project_id = target_project_id
  )
$$;

create or replace function public.can_edit_project(target_project_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_operator() or (
    public.current_profile_role() = 'diretor_executivo'
    and public.can_access_project(target_project_id)
  )
$$;

alter table public.project_memberships enable row level security;

drop policy if exists "members read own project access" on public.project_memberships;
create policy "members read own project access" on public.project_memberships
  for select using (profile_id = auth.uid() or public.is_super_admin());

drop policy if exists "admins manage project access" on public.project_memberships;
create policy "admins manage project access" on public.project_memberships
  for all using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists "profiles admin writes" on public.profiles;
create policy "profiles admin writes" on public.profiles
  for all using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists "admin writes sensitive settings" on public.settings;
create policy "admin writes sensitive settings" on public.settings
  for all using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists "admin permissions" on public.user_permissions;
create policy "admin permissions" on public.user_permissions
  for all using (public.is_super_admin()) with check (public.is_super_admin());

drop policy if exists "operators read settings" on public.settings;
create policy "operators read settings" on public.settings
  for select using (public.is_super_admin());

drop policy if exists "assigned members read projects" on public.projects;
create policy "assigned members read projects" on public.projects
  for select using (public.can_access_project(id));
drop policy if exists "assigned editors update projects" on public.projects;
create policy "assigned editors update projects" on public.projects
  for update using (public.can_edit_project(id)) with check (public.can_edit_project(id));

drop policy if exists "assigned members read project stages" on public.project_stages;
create policy "assigned members read project stages" on public.project_stages
  for select using (public.can_access_project(project_id));
drop policy if exists "assigned editors write project stages" on public.project_stages;
create policy "assigned editors write project stages" on public.project_stages
  for all using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

drop policy if exists "assigned members read documents" on public.documents;
create policy "assigned members read documents" on public.documents
  for select using (public.can_access_project(project_id));
drop policy if exists "assigned editors write documents" on public.documents;
create policy "assigned editors write documents" on public.documents
  for all using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

drop policy if exists "assigned members read media" on public.media;
create policy "assigned members read media" on public.media
  for select using (public.can_access_project(project_id));
drop policy if exists "assigned editors write media" on public.media;
create policy "assigned editors write media" on public.media
  for all using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

drop policy if exists "assigned members read activities" on public.activities;
create policy "assigned members read activities" on public.activities
  for select using (public.can_access_project(project_id));
drop policy if exists "assigned editors write activities" on public.activities;
create policy "assigned editors write activities" on public.activities
  for all using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

drop policy if exists "assigned members read participants" on public.participants;
create policy "assigned members read participants" on public.participants
  for select using (public.can_access_project(project_id));
drop policy if exists "assigned editors write participants" on public.participants;
create policy "assigned editors write participants" on public.participants
  for all using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

drop policy if exists "assigned members read team" on public.team_members;
create policy "assigned members read team" on public.team_members
  for select using (public.can_access_project(project_id));
drop policy if exists "assigned editors write team" on public.team_members;
create policy "assigned editors write team" on public.team_members
  for all using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

drop policy if exists "assigned members read budget" on public.budget_items;
create policy "assigned members read budget" on public.budget_items
  for select using (public.can_access_project(project_id));
drop policy if exists "assigned editors write budget" on public.budget_items;
create policy "assigned editors write budget" on public.budget_items
  for all using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

drop policy if exists "assigned members read expenses" on public.expenses;
create policy "assigned members read expenses" on public.expenses
  for select using (public.can_access_project(project_id));
drop policy if exists "assigned editors write expenses" on public.expenses;
create policy "assigned editors write expenses" on public.expenses
  for all using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

drop policy if exists "assigned members read reports" on public.reports;
create policy "assigned members read reports" on public.reports
  for select using (public.can_access_project(project_id));
drop policy if exists "assigned editors write reports" on public.reports;
create policy "assigned editors write reports" on public.reports
  for all using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

drop policy if exists "assigned members read official documents" on public.official_documents;
create policy "assigned members read official documents" on public.official_documents
  for select using (public.can_access_project(project_id));
drop policy if exists "assigned editors write official documents" on public.official_documents;
create policy "assigned editors write official documents" on public.official_documents
  for all using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

drop policy if exists "assigned members read classes" on public.classes;
create policy "assigned members read classes" on public.classes
  for select using (exists (
    select 1 from public.activities
    where activities.id = classes.activity_id
      and public.can_access_project(activities.project_id)
  ));
drop policy if exists "assigned editors write classes" on public.classes;
create policy "assigned editors write classes" on public.classes
  for all using (exists (
    select 1 from public.activities
    where activities.id = classes.activity_id
      and public.can_edit_project(activities.project_id)
  )) with check (exists (
    select 1 from public.activities
    where activities.id = classes.activity_id
      and public.can_edit_project(activities.project_id)
  ));

drop policy if exists "assigned members read attendance" on public.attendance;
create policy "assigned members read attendance" on public.attendance
  for select using (exists (
    select 1 from public.participants
    where participants.id = attendance.participant_id
      and public.can_access_project(participants.project_id)
  ));
drop policy if exists "assigned editors write attendance" on public.attendance;
create policy "assigned editors write attendance" on public.attendance
  for all using (exists (
    select 1 from public.participants
    where participants.id = attendance.participant_id
      and public.can_edit_project(participants.project_id)
  )) with check (exists (
    select 1 from public.participants
    where participants.id = attendance.participant_id
      and public.can_edit_project(participants.project_id)
  ));

drop policy if exists "assigned members read certificate templates" on public.certificate_templates;
create policy "assigned members read certificate templates" on public.certificate_templates
  for select using (project_id is not null and public.can_access_project(project_id));
drop policy if exists "assigned editors write certificate templates" on public.certificate_templates;
create policy "assigned editors write certificate templates" on public.certificate_templates
  for all using (project_id is not null and public.can_edit_project(project_id))
  with check (project_id is not null and public.can_edit_project(project_id));

drop policy if exists "assigned members read certificates" on public.certificates;
create policy "assigned members read certificates" on public.certificates
  for select using (public.can_access_project(project_id));
drop policy if exists "assigned editors write certificates" on public.certificates;
create policy "assigned editors write certificates" on public.certificates
  for all using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

drop policy if exists "assigned members read certificate batches" on public.certificate_batches;
create policy "assigned members read certificate batches" on public.certificate_batches
  for select using (public.can_access_project(project_id));
drop policy if exists "assigned editors write certificate batches" on public.certificate_batches;
create policy "assigned editors write certificate batches" on public.certificate_batches
  for all using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

drop policy if exists "assigned members read certificate signatures" on public.certificate_signatures;
create policy "assigned members read certificate signatures" on public.certificate_signatures
  for select using (exists (
    select 1 from public.certificate_templates
    where certificate_templates.id = certificate_signatures.template_id
      and certificate_templates.project_id is not null
      and public.can_access_project(certificate_templates.project_id)
  ));
drop policy if exists "assigned directors write certificate signatures" on public.certificate_signatures;
create policy "assigned directors write certificate signatures" on public.certificate_signatures
  for all using (exists (
    select 1 from public.certificate_templates
    where certificate_templates.id = certificate_signatures.template_id
      and certificate_templates.project_id is not null
      and public.can_edit_project(certificate_templates.project_id)
  )) with check (exists (
    select 1 from public.certificate_templates
    where certificate_templates.id = certificate_signatures.template_id
      and certificate_templates.project_id is not null
      and public.can_edit_project(certificate_templates.project_id)
  ));

drop policy if exists "assigned members read certificate sponsor logos" on public.certificate_sponsor_logos;
create policy "assigned members read certificate sponsor logos" on public.certificate_sponsor_logos
  for select using (exists (
    select 1 from public.certificate_templates
    where certificate_templates.id = certificate_sponsor_logos.template_id
      and certificate_templates.project_id is not null
      and public.can_access_project(certificate_templates.project_id)
  ));
drop policy if exists "assigned directors write certificate sponsor logos" on public.certificate_sponsor_logos;
create policy "assigned directors write certificate sponsor logos" on public.certificate_sponsor_logos
  for all using (exists (
    select 1 from public.certificate_templates
    where certificate_templates.id = certificate_sponsor_logos.template_id
      and certificate_templates.project_id is not null
      and public.can_edit_project(certificate_templates.project_id)
  )) with check (exists (
    select 1 from public.certificate_templates
    where certificate_templates.id = certificate_sponsor_logos.template_id
      and certificate_templates.project_id is not null
      and public.can_edit_project(certificate_templates.project_id)
  ));

drop policy if exists "assigned members read certificate footer logos" on public.certificate_footer_logos;
create policy "assigned members read certificate footer logos" on public.certificate_footer_logos
  for select using (project_id is not null and public.can_access_project(project_id));
drop policy if exists "assigned directors write certificate footer logos" on public.certificate_footer_logos;
create policy "assigned directors write certificate footer logos" on public.certificate_footer_logos
  for all using (project_id is not null and public.can_edit_project(project_id))
  with check (project_id is not null and public.can_edit_project(project_id));

drop policy if exists "assigned members read certificate back images" on public.certificate_back_final_images;
create policy "assigned members read certificate back images" on public.certificate_back_final_images
  for select using (project_id is not null and public.can_access_project(project_id));
drop policy if exists "assigned directors write certificate back images" on public.certificate_back_final_images;
create policy "assigned directors write certificate back images" on public.certificate_back_final_images
  for all using (project_id is not null and public.can_edit_project(project_id))
  with check (project_id is not null and public.can_edit_project(project_id));

drop policy if exists "assigned members read certificate footer settings" on public.certificate_footer_settings;
create policy "assigned members read certificate footer settings" on public.certificate_footer_settings
  for select using (project_id is not null and public.can_access_project(project_id));
drop policy if exists "assigned directors write certificate footer settings" on public.certificate_footer_settings;
create policy "assigned directors write certificate footer settings" on public.certificate_footer_settings
  for all using (project_id is not null and public.can_edit_project(project_id))
  with check (project_id is not null and public.can_edit_project(project_id));

drop policy if exists "assigned directors read project storage objects" on storage.objects;

drop policy if exists "operators read storage objects" on storage.objects;
create policy "operators read storage objects" on storage.objects
  for select using (
    bucket_id in ('project-covers','project-banners','documents','photos','reports','official-documents','avatars')
    and public.is_operator()
  );

drop policy if exists "operators upload storage objects" on storage.objects;
create policy "operators upload storage objects" on storage.objects
  for insert with check (
    bucket_id in ('project-covers','project-banners','documents','photos','reports','official-documents','avatars')
    and public.is_operator()
    and lower(name) !~ '\.(mp4|mov|avi|mkv|webm)$'
  );

drop policy if exists "operators update storage objects" on storage.objects;
create policy "operators update storage objects" on storage.objects
  for update using (
    public.is_operator() and bucket_id <> 'settings-assets'
  ) with check (
    public.is_operator()
    and bucket_id <> 'settings-assets'
    and lower(name) !~ '\.(mp4|mov|avi|mkv|webm)$'
  );

drop policy if exists "super admin manages settings assets" on storage.objects;
create policy "super admin manages settings assets" on storage.objects
  for all using (
    bucket_id = 'settings-assets' and public.is_super_admin()
  ) with check (
    bucket_id = 'settings-assets'
    and public.is_super_admin()
    and lower(name) !~ '\.(mp4|mov|avi|mkv|webm)$'
  );

drop policy if exists "admin delete storage objects" on storage.objects;
create policy "admin delete storage objects" on storage.objects
  for delete using (
    (bucket_id <> 'settings-assets' and public.is_admin())
    or (bucket_id = 'settings-assets' and public.is_super_admin())
  );

create policy "assigned directors read project storage objects" on storage.objects
  for select using (
    bucket_id in ('project-covers','project-banners','documents','photos','reports','official-documents')
    and exists (
      select 1
      from public.projects project
      where project.id::text = (storage.foldername(name))[1]
        and public.can_access_project(project.id)
    )
  );

drop policy if exists "assigned directors upload project storage objects" on storage.objects;
create policy "assigned directors upload project storage objects" on storage.objects
  for insert with check (
    bucket_id in ('project-covers','project-banners','documents','photos','reports','official-documents')
    and lower(name) !~ '\.(mp4|mov|avi|mkv|webm)$'
    and exists (
      select 1
      from public.projects project
      where project.id::text = (storage.foldername(name))[1]
        and public.can_edit_project(project.id)
    )
  );

drop policy if exists "assigned directors update project storage objects" on storage.objects;
create policy "assigned directors update project storage objects" on storage.objects
  for update using (
    exists (
      select 1
      from public.projects project
      where project.id::text = (storage.foldername(name))[1]
        and public.can_edit_project(project.id)
    )
  ) with check (
    lower(name) !~ '\.(mp4|mov|avi|mkv|webm)$'
    and exists (
      select 1
      from public.projects project
      where project.id::text = (storage.foldername(name))[1]
        and public.can_edit_project(project.id)
    )
  );
