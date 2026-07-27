-- Helper function to centralize "admin" checks for RLS and simplify policies.
-- This reduces duplicated subqueries across policies and makes future changes easier.

CREATE OR REPLACE FUNCTION public.is_admin(p_uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_uid
      AND username = 'admin'
  );
$$;

-- Update high-traffic admin policies to use public.is_admin()
DO $$
BEGIN
  -- Ghost user system policies
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ghost_persona_groups'
      AND policyname = 'Only admins can manage ghost persona groups'
  ) THEN
    EXECUTE 'ALTER POLICY "Only admins can manage ghost persona groups" ON public.ghost_persona_groups USING (public.is_admin()) WITH CHECK (public.is_admin())';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ghost_action_queue'
      AND policyname = 'Admins can view ghost action queue'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can view ghost action queue" ON public.ghost_action_queue USING (public.is_admin())';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ghost_action_queue'
      AND policyname = 'Admins can create ghost actions'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can create ghost actions" ON public.ghost_action_queue WITH CHECK (public.is_admin() AND created_by = auth.uid())';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ghost_action_queue'
      AND policyname = 'Admins can update ghost actions'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can update ghost actions" ON public.ghost_action_queue USING (public.is_admin())';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ghost_action_queue'
      AND policyname = 'Admins can delete ghost actions'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can delete ghost actions" ON public.ghost_action_queue USING (public.is_admin())';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'ghost_action_log'
      AND policyname = 'Admins can view ghost action log'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can view ghost action log" ON public.ghost_action_log USING (public.is_admin())';
  END IF;

  -- Proposals admin policies
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'proposals'
      AND policyname = 'Admins can view all proposals'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can view all proposals" ON public.proposals USING (public.is_admin())';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'proposals'
      AND policyname = 'Admins can update proposals'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can update proposals" ON public.proposals USING (public.is_admin())';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'proposals'
      AND policyname = 'Admins can delete proposals'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can delete proposals" ON public.proposals USING (public.is_admin())';
  END IF;

  -- Storage admin policies (media bucket)
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Admins can upload anywhere in media bucket'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can upload anywhere in media bucket" ON storage.objects WITH CHECK (bucket_id = ''media'' AND public.is_admin())';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Admins can update anywhere in media bucket'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can update anywhere in media bucket" ON storage.objects USING (bucket_id = ''media'' AND public.is_admin())';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Admins can delete anywhere in media bucket'
  ) THEN
    EXECUTE 'ALTER POLICY "Admins can delete anywhere in media bucket" ON storage.objects USING (bucket_id = ''media'' AND public.is_admin())';
  END IF;
END $$;

