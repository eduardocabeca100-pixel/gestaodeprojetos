insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('project-covers', 'project-covers', true, 10485760, array['image/jpeg','image/png','image/webp']),
  ('project-banners', 'project-banners', true, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "operators read project cover banner public buckets" on storage.objects;
create policy "operators read project cover banner public buckets" on storage.objects
  for select using (
    bucket_id in ('project-covers', 'project-banners')
  );

drop policy if exists "operators upload project cover banner public buckets" on storage.objects;
create policy "operators upload project cover banner public buckets" on storage.objects
  for insert with check (
    bucket_id in ('project-covers', 'project-banners')
    and public.is_operator()
    and lower(name) !~ '\.(mp4|mov|avi|mkv|webm)$'
  );

drop policy if exists "operators update project cover banner public buckets" on storage.objects;
create policy "operators update project cover banner public buckets" on storage.objects
  for update using (
    bucket_id in ('project-covers', 'project-banners')
    and public.is_operator()
  ) with check (
    bucket_id in ('project-covers', 'project-banners')
    and public.is_operator()
    and lower(name) !~ '\.(mp4|mov|avi|mkv|webm)$'
  );
