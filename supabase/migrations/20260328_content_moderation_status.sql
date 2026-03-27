-- Moderation workflow for user-generated stories and forum posts.
-- Status: pending (queue) | verified (approved) | archived (removed from public feeds)

-- Stories
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'verified';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'stories_moderation_status_check'
      AND conrelid = 'public.stories'::regclass
  ) THEN
    ALTER TABLE public.stories
      ADD CONSTRAINT stories_moderation_status_check
      CHECK (moderation_status IN ('pending', 'verified', 'archived'));
  END IF;
END $$;

ALTER TABLE public.stories ALTER COLUMN moderation_status SET DEFAULT 'pending';

-- Forum posts
ALTER TABLE public.forum_posts
  ADD COLUMN IF NOT EXISTS moderation_status text NOT NULL DEFAULT 'verified';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'forum_posts_moderation_status_check'
      AND conrelid = 'public.forum_posts'::regclass
  ) THEN
    ALTER TABLE public.forum_posts
      ADD CONSTRAINT forum_posts_moderation_status_check
      CHECK (moderation_status IN ('pending', 'verified', 'archived'));
  END IF;
END $$;

-- Text-only posts stay verified by default; app sets pending when media is attached.
ALTER TABLE public.forum_posts ALTER COLUMN moderation_status SET DEFAULT 'verified';

CREATE INDEX IF NOT EXISTS idx_stories_event_moderation_pending
  ON public.stories (event_id, moderation_status)
  WHERE media_url IS NOT NULL AND btrim(media_url) <> '';

CREATE INDEX IF NOT EXISTS idx_forum_posts_event_moderation_pending
  ON public.forum_posts (event_id, moderation_status)
  WHERE media_url IS NOT NULL AND btrim(media_url) <> '';

-- Admins may update moderation_status on any row (RLS ORs with existing owner policies).
DROP POLICY IF EXISTS "Admins can moderate all stories" ON public.stories;
CREATE POLICY "Admins can moderate all stories"
  ON public.stories
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can moderate all forum posts" ON public.forum_posts;
CREATE POLICY "Admins can moderate all forum posts"
  ON public.forum_posts
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
