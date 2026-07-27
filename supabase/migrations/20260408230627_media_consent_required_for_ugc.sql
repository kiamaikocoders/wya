-- User-generated public content requires media consent (or ghost / primary admin profile).
-- Version must match app MEDIA_CONSENT_VERSION (see src/legal/policy-versions.ts).

CREATE OR REPLACE FUNCTION public.current_user_may_post_user_generated_content()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.account_status = 'active'
      AND (
        COALESCE(p.is_ghost, false) = true
        OR public.is_admin()
        OR (
          p.media_consent = true
          AND p.media_consent_version IS NOT DISTINCT FROM '2026-03-26'
        )
      )
  );
$$;

-- Forum
DROP POLICY IF EXISTS "Authenticated users can create forum posts" ON public.forum_posts;
CREATE POLICY "Authenticated users can create forum posts" ON public.forum_posts
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
    AND public.current_profile_is_active()
    AND public.current_user_may_post_user_generated_content()
  );

DROP POLICY IF EXISTS "Authenticated users can create forum comments" ON public.forum_comments;
CREATE POLICY "Authenticated users can create forum comments" ON public.forum_comments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
    AND public.current_profile_is_active()
    AND public.current_user_may_post_user_generated_content()
  );

-- Stories
DROP POLICY IF EXISTS "Users can create their own stories" ON public.stories;
CREATE POLICY "Users can create their own stories" ON public.stories
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.current_profile_is_active()
    AND public.current_user_may_post_user_generated_content()
  );

-- Story comments (tighten user_id match + consent)
DROP POLICY IF EXISTS "Authenticated users can create story comments" ON public.story_comments;
CREATE POLICY "Authenticated users can create story comments" ON public.story_comments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
    AND public.current_profile_is_active()
    AND public.current_user_may_post_user_generated_content()
  );

-- Community posts / comments
DROP POLICY IF EXISTS "Users can create community posts" ON public.community_posts;
CREATE POLICY "Users can create community posts" ON public.community_posts
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
    AND public.current_profile_is_active()
    AND public.current_user_may_post_user_generated_content()
  );

DROP POLICY IF EXISTS "Users can create community post comments" ON public.community_post_comments;
CREATE POLICY "Users can create community post comments" ON public.community_post_comments
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND auth.uid() = user_id
    AND public.current_profile_is_active()
    AND public.current_user_may_post_user_generated_content()
  );
