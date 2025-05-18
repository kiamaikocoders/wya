
-- Functions to increment and decrement story counters

-- Function to increment the likes count for a story
CREATE OR REPLACE FUNCTION public.increment_story_likes_count(p_story_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE stories
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = p_story_id;
END;
$$;

-- Function to decrement the likes count for a story
CREATE OR REPLACE FUNCTION public.decrement_story_likes_count(p_story_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE stories
  SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
  WHERE id = p_story_id;
END;
$$;

-- Function to increment the comments count for a story
CREATE OR REPLACE FUNCTION public.increment_story_comments_count(p_story_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE stories
  SET comments_count = COALESCE(comments_count, 0) + 1
  WHERE id = p_story_id;
END;
$$;
