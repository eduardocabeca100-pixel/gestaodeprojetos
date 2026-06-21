insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('project-covers', 'project-covers', false, 10485760, array['image/jpeg','image/png','image/webp']),
  ('project-banners', 'project-banners', false, 10485760, array['image/jpeg','image/png','image/webp']),
  ('documents', 'documents', false, 52428800, array[
    'application/pdf',
    'image/jpeg',
    'image/png',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/zip'
  ]),
  ('photos', 'photos', false, 20971520, array['image/jpeg','image/png','image/webp']),
  ('reports', 'reports', false, 52428800, array['application/pdf','application/zip','text/plain']),
  ('official-documents', 'official-documents', false, 52428800, array['application/pdf','text/plain','image/jpeg','image/png','image/webp','image/svg+xml']),
  ('settings-assets', 'settings-assets', false, 10485760, array['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('avatars', 'avatars', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "operators read storage objects" on storage.objects
  for select using (
    bucket_id in ('project-covers','project-banners','documents','photos','reports','official-documents','avatars')
    and public.is_operator()
  );

create policy "operators upload storage objects" on storage.objects
  for insert with check (
    bucket_id in ('project-covers','project-banners','documents','photos','reports','official-documents','avatars')
    and public.is_operator()
    and lower(name) !~ '\.(mp4|mov|avi|mkv|webm)$'
  );

-- Arquivos de projeto usam o UUID do projeto como primeira pasta:
-- <project_id>/<arquivo>. Assim o acesso ao arquivo segue o acesso ao projeto.
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

create policy "operators update storage objects" on storage.objects
  for update using (
    public.is_operator() and bucket_id <> 'settings-assets'
  ) with check (
    public.is_operator()
    and bucket_id <> 'settings-assets'
    and lower(name) !~ '\.(mp4|mov|avi|mkv|webm)$'
  );

create policy "super admin manages settings assets" on storage.objects
  for all using (
    bucket_id = 'settings-assets' and public.is_super_admin()
  ) with check (
    bucket_id = 'settings-assets'
    and public.is_super_admin()
    and lower(name) !~ '\.(mp4|mov|avi|mkv|webm)$'
  );

create policy "admin delete storage objects" on storage.objects
  for delete using (
    (bucket_id <> 'settings-assets' and public.is_admin())
    or (bucket_id = 'settings-assets' and public.is_super_admin())
  );
