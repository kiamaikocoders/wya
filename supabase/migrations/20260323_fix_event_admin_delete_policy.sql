-- Explicitly allow admin users to delete events via RLS.
-- Some deployments can end up with the older "Admins can manage all events" policy
-- not granting DELETE correctly (e.g., due to FOR ALL semantics or policy evaluation).
--
-- We add a dedicated DELETE policy that uses the `public.is_admin()` helper when present.

DO $$
DECLARE
  has_is_admin boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'is_admin'
  )
  INTO has_is_admin;

  DROP POLICY IF EXISTS "Admins can delete all events" ON public.events;

  IF has_is_admin THEN
    CREATE POLICY "Admins can delete all events"
      ON public.events
      FOR DELETE
      USING (public.is_admin());
  ELSE
    CREATE POLICY "Admins can delete all events"
      ON public.events
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1
          FROM public.profiles
          WHERE id = auth.uid()
            AND username = 'admin'
        )
      );
  END IF;
END $$;

