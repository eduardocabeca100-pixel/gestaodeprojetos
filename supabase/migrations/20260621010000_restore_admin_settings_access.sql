drop policy if exists "profiles admin writes" on public.profiles;
create policy "profiles admin writes" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "members read own project access" on public.project_memberships;
create policy "members read own project access" on public.project_memberships
  for select using (profile_id = auth.uid() or public.is_admin());

drop policy if exists "admins manage project access" on public.project_memberships;
create policy "admins manage project access" on public.project_memberships
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "operators read settings" on public.settings;
create policy "operators read settings" on public.settings
  for select using (public.is_admin());

drop policy if exists "admin writes sensitive settings" on public.settings;
create policy "admin writes sensitive settings" on public.settings
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin permissions" on public.user_permissions;
create policy "admin permissions" on public.user_permissions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "super admin manages settings assets" on storage.objects;
create policy "admins manage settings assets" on storage.objects
  for all using (
    bucket_id = 'settings-assets' and public.is_admin()
  ) with check (
    bucket_id = 'settings-assets'
    and public.is_admin()
    and lower(name) !~ '\.(mp4|mov|avi|mkv|webm)$'
  );

drop policy if exists "admin delete storage objects" on storage.objects;
create policy "admin delete storage objects" on storage.objects
  for delete using (public.is_admin());
