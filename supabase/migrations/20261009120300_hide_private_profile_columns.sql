-- Profiles are readable by everyone, but only the public columns below. Phone, birth date,
-- coordinates, consent, ghost flag, and account status are available to the owner via
-- get_my_profile() and to admins via admin_profiles().
REVOKE SELECT ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id,
  username,
  full_name,
  avatar_url,
  bio,
  location,
  profile_visibility,
  favorite_categories,
  created_at,
  updated_at
) ON public.profiles TO anon, authenticated;

-- Policies run with the caller's column privileges, so check account status via the definer helper.
ALTER POLICY "Users can update their own profile" ON public.profiles
  USING ((SELECT auth.uid()) = id AND public.current_profile_is_active())
  WITH CHECK ((SELECT auth.uid()) = id AND public.current_profile_is_active());
