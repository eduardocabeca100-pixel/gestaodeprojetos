DO $$
BEGIN
  CREATE TYPE public.admin_role AS ENUM ('diretor_executivo', 'admin', 'super_admin');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.admin_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  role public.admin_role NOT NULL DEFAULT 'diretor_executivo',
  active boolean NOT NULL DEFAULT true,
  permissions text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS admin_profiles_set_updated_at ON public.admin_profiles;

CREATE TRIGGER admin_profiles_set_updated_at
BEFORE UPDATE ON public.admin_profiles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_profiles
    WHERE id = auth.uid()
      AND role = 'super_admin'
      AND active = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

ALTER TABLE public.admin_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_profiles_select_self_or_super" ON public.admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_insert_super" ON public.admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_update_super" ON public.admin_profiles;
DROP POLICY IF EXISTS "admin_profiles_delete_super" ON public.admin_profiles;

CREATE POLICY "admin_profiles_select_self_or_super"
ON public.admin_profiles
FOR SELECT
TO authenticated
USING (
  id = auth.uid()
  OR public.is_super_admin()
);

CREATE POLICY "admin_profiles_insert_super"
ON public.admin_profiles
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin());

CREATE POLICY "admin_profiles_update_super"
ON public.admin_profiles
FOR UPDATE
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

CREATE POLICY "admin_profiles_delete_super"
ON public.admin_profiles
FOR DELETE
TO authenticated
USING (public.is_super_admin());
