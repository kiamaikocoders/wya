-- Admin Atlas: allow admins to read aggregated demand signals
-- (onboarding preferences + favourites) for coverage / signup layers.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'user_onboarding_preferences'
      AND policyname = 'Admins can view all onboarding preferences'
  ) THEN
    CREATE POLICY "Admins can view all onboarding preferences"
      ON public.user_onboarding_preferences
      FOR SELECT
      TO authenticated
      USING (public.is_admin());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'favorites'
      AND policyname = 'Admins can view all favorites'
  ) THEN
    CREATE POLICY "Admins can view all favorites"
      ON public.favorites
      FOR SELECT
      TO authenticated
      USING (public.is_admin());
  END IF;
END $$;
