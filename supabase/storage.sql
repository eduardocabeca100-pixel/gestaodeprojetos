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
  ('reports', 'reports', false, 52428800, array['application/pdf','application/zip']),
  ('avatars', 'avatars', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "operators read storage objects" on storage.objects
  for select using (
    bucket_id in ('project-covers','project-banners','documents','photos','reports','avatars')
    and public.is_operator()
  );

create policy "operators upload storage objects" on storage.objects
  for insert with check (
    bucket_id in ('project-covers','project-banners','documents','photos','reports','avatars')
    and public.is_operator()
    and lower(name) !~ '\.(mp4|mov|avi|mkv|webm)$'
  );

create policy "operators update storage objects" on storage.objects
  for update using (public.is_operator()) with check (
    public.is_operator()
    and lower(name) !~ '\.(mp4|mov|avi|mkv|webm)$'
  );

create policy "admin delete storage objects" on storage.objects
  for delete using (public.is_admin());
