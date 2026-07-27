-- Allow admins to hard-delete ghost stories (and related engagement rows) via RPC.
-- Ghost Content in the admin portal calls public.admin_delete_ghost_story().

CREATE OR REPLACE FUNCTION public.admin_delete_ghost_story(p_story_id bigint)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_story public.stories%ROWTYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can delete ghost stories';
  END IF;

  SELECT * INTO v_story
  FROM public.stories
  WHERE id = p_story_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Story not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = v_story.user_id
      AND p.is_ghost = true
  ) THEN
    RAISE EXCEPTION 'Story is not owned by a ghost account';
  END IF;

  DELETE FROM public.story_likes WHERE story_id = p_story_id;
  DELETE FROM public.story_comments WHERE story_id = p_story_id;
  DELETE FROM public.stories WHERE id = p_story_id;

  RETURN jsonb_build_object(
    'id', v_story.id,
    'media_url', v_story.media_url
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_ghost_story(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_ghost_story(bigint) TO authenticated;

-- Fallback policy if callers use direct DELETE instead of the RPC.
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

  DROP POLICY IF EXISTS "Admins can delete ghost stories" ON public.stories;

  IF has_is_admin THEN
    CREATE POLICY "Admins can delete ghost stories"
      ON public.stories
      FOR DELETE
      USING (
        public.is_admin()
        AND EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = stories.user_id
            AND p.is_ghost = true
        )
      );
  ELSE
    CREATE POLICY "Admins can delete ghost stories"
      ON public.stories
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1
          FROM public.profiles admin_profile
          WHERE admin_profile.id = auth.uid()
            AND admin_profile.username = 'admin'
        )
        AND EXISTS (
          SELECT 1
          FROM public.profiles p
          WHERE p.id = stories.user_id
            AND p.is_ghost = true
        )
      );
  END IF;
END $$;
