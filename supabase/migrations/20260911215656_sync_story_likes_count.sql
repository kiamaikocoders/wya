-- Keep stories.likes_count in sync when story_likes rows are added/removed.
-- Mirrors public.sync_forum_post_likes_count() so Discover counts survive refresh.

CREATE OR REPLACE FUNCTION public.sync_story_likes_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.stories
    SET likes_count = COALESCE(likes_count, 0) + 1
    WHERE id = NEW.story_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.stories
    SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
    WHERE id = OLD.story_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_story_likes_count ON public.story_likes;
CREATE TRIGGER trg_sync_story_likes_count
AFTER INSERT OR DELETE ON public.story_likes
FOR EACH ROW
EXECUTE FUNCTION public.sync_story_likes_count();

REVOKE EXECUTE ON FUNCTION public.sync_story_likes_count() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_story_likes_count() TO service_role;
