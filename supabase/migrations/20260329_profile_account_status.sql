-- Account lifecycle: active | suspended | banned | deleted (soft delete / anonymized)
-- Admins change status via RPC (SECURITY DEFINER). Users cannot self-change account_status.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_account_status_check'
      AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_account_status_check
      CHECK (account_status IN ('active', 'suspended', 'banned', 'deleted'));
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status_reason text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status_changed_at timestamptz;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status_changed_by uuid;

UPDATE public.profiles SET account_status = 'active' WHERE account_status IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles (account_status);

-- True when the signed-in user has an active (non-locked) profile.
CREATE OR REPLACE FUNCTION public.current_profile_is_active()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.account_status = 'active'
  );
$$;

-- Prevent non-admins from changing account_status (admins use RPC or bypass via policy).
CREATE OR REPLACE FUNCTION public.prevent_profile_account_status_user_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_status IS DISTINCT FROM OLD.account_status THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only administrators can change account_status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_profiles_guard_account_status ON public.profiles;
CREATE TRIGGER tr_profiles_guard_account_status
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.prevent_profile_account_status_user_change();

CREATE OR REPLACE FUNCTION public.admin_set_account_status(
  p_target uuid,
  p_status text,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_username text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_target IS NULL OR p_target = auth.uid() THEN
    RAISE EXCEPTION 'invalid target';
  END IF;

  IF p_status NOT IN ('active', 'suspended', 'banned', 'deleted') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;

  SELECT username INTO target_username FROM public.profiles WHERE id = p_target;
  IF target_username IS NULL THEN
    RAISE EXCEPTION 'user not found';
  END IF;

  IF target_username = 'admin' THEN
    RAISE EXCEPTION 'cannot change primary admin account this way';
  END IF;

  UPDATE public.profiles SET
    account_status = p_status,
    account_status_reason = p_reason,
    account_status_changed_at = now(),
    account_status_changed_by = auth.uid()
  WHERE id = p_target;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_account_status(uuid, text, text) TO authenticated;

-- Soft delete: lock account + strip PII (auth.users row remains; delete via Supabase Dashboard / service role if needed).
CREATE OR REPLACE FUNCTION public.admin_soft_delete_user(
  p_target uuid,
  p_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_target IS NULL OR p_target = auth.uid() THEN
    RAISE EXCEPTION 'invalid target';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_target AND username = 'admin') THEN
    RAISE EXCEPTION 'cannot delete primary admin account';
  END IF;

  UPDATE public.profiles SET
    account_status = 'deleted',
    account_status_reason = COALESCE(p_reason, 'Account removed by administrator'),
    account_status_changed_at = now(),
    account_status_changed_by = auth.uid(),
    full_name = NULL,
    bio = NULL,
    phone = NULL,
    avatar_url = NULL,
    location = NULL,
    latitude = NULL,
    longitude = NULL,
    username = 'deleted_' || replace(p_target::text, '-', '')
  WHERE id = p_target;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_soft_delete_user(uuid, text) TO authenticated;

-- Stories: require active account and correct user (closes open INSERT hole).
DROP POLICY IF EXISTS "Users can create their own stories" ON public.stories;
CREATE POLICY "Users can create their own stories" ON public.stories
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.current_profile_is_active()
  );

-- Forum posts
DROP POLICY IF EXISTS "Authenticated users can create forum posts" ON public.forum_posts;
CREATE POLICY "Authenticated users can create forum posts" ON public.forum_posts
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
    AND public.current_profile_is_active()
  );

DROP POLICY IF EXISTS "Users can update their own forum posts" ON public.forum_posts;
CREATE POLICY "Users can update their own forum posts" ON public.forum_posts
  FOR UPDATE
  USING (auth.uid() = user_id AND public.current_profile_is_active())
  WITH CHECK (auth.uid() = user_id AND public.current_profile_is_active());

DROP POLICY IF EXISTS "Users can delete their own forum posts" ON public.forum_posts;
CREATE POLICY "Users can delete their own forum posts" ON public.forum_posts
  FOR DELETE
  USING (auth.uid() = user_id AND public.current_profile_is_active());

-- Forum comments
DROP POLICY IF EXISTS "Authenticated users can create forum comments" ON public.forum_comments;
CREATE POLICY "Authenticated users can create forum comments" ON public.forum_comments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
    AND public.current_profile_is_active()
  );

DROP POLICY IF EXISTS "Users can update their own forum comments" ON public.forum_comments;
CREATE POLICY "Users can update their own forum comments" ON public.forum_comments
  FOR UPDATE
  USING (auth.uid() = user_id AND public.current_profile_is_active())
  WITH CHECK (auth.uid() = user_id AND public.current_profile_is_active());

DROP POLICY IF EXISTS "Users can delete their own forum comments" ON public.forum_comments;
CREATE POLICY "Users can delete their own forum comments" ON public.forum_comments
  FOR DELETE
  USING (auth.uid() = user_id AND public.current_profile_is_active());

-- Profiles: only active users may edit their own row (admins use separate policy + RPC).
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id AND account_status = 'active')
  WITH CHECK (auth.uid() = id AND account_status = 'active');

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Events: require active organizer for new events
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;
CREATE POLICY "Authenticated users can create events" ON public.events
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = organizer_id
    AND public.current_profile_is_active()
  );

DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
CREATE POLICY "Users can update their own events" ON public.events
  FOR UPDATE
  USING (auth.uid() = organizer_id AND public.current_profile_is_active())
  WITH CHECK (auth.uid() = organizer_id AND public.current_profile_is_active());

DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;
CREATE POLICY "Users can delete their own events" ON public.events
  FOR DELETE
  USING (auth.uid() = organizer_id AND public.current_profile_is_active());

-- Tickets
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
CREATE POLICY "Users can create tickets" ON public.tickets
  FOR INSERT
  WITH CHECK (auth.uid() = user_id AND public.current_profile_is_active());

DROP POLICY IF EXISTS "Users can update their own tickets" ON public.tickets;
CREATE POLICY "Users can update their own tickets" ON public.tickets
  FOR UPDATE
  USING (auth.uid() = user_id AND public.current_profile_is_active())
  WITH CHECK (auth.uid() = user_id AND public.current_profile_is_active());

DROP POLICY IF EXISTS "Users can delete their own tickets" ON public.tickets;
CREATE POLICY "Users can delete their own tickets" ON public.tickets
  FOR DELETE
  USING (auth.uid() = user_id AND public.current_profile_is_active());

-- Stories: owner update/delete only while active
DROP POLICY IF EXISTS "Users can update their own stories" ON public.stories;
CREATE POLICY "Users can update their own stories" ON public.stories
  FOR UPDATE
  USING (auth.uid() = user_id AND public.current_profile_is_active())
  WITH CHECK (auth.uid() = user_id AND public.current_profile_is_active());

DROP POLICY IF EXISTS "Users can delete their own stories" ON public.stories;
CREATE POLICY "Users can delete their own stories" ON public.stories
  FOR DELETE
  USING (auth.uid() = user_id AND public.current_profile_is_active());

-- Messages
DROP POLICY IF EXISTS "Users can create messages" ON public.messages;
CREATE POLICY "Users can create messages" ON public.messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id AND public.current_profile_is_active());
