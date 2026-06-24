-- Corrige capa/banner de projetos: URLs públicas precisam de buckets públicos.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('project-covers', 'project-covers', true, 10485760, array['image/png','image/jpeg','image/webp']),
  ('project-banners', 'project-banners', true, 10485760, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/png','image/jpeg','image/webp'];

drop policy if exists "public read project covers and banners" on storage.objects;
create policy "public read project covers and banners" on storage.objects
  for select using (bucket_id in ('project-covers', 'project-banners'));
