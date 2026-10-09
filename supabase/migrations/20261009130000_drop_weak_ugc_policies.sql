-- Permissive policies are OR'ed, so these owner-only duplicates let suspended accounts and
-- users without media consent bypass the stricter policies that remain on each table.
DROP POLICY IF EXISTS "Forum posts can be created by authenticated users" ON public.forum_posts;
DROP POLICY IF EXISTS "Forum posts can be updated by their authors" ON public.forum_posts;
DROP POLICY IF EXISTS "Forum posts can be deleted by their authors" ON public.forum_posts;

DROP POLICY IF EXISTS "Forum comments can be created by authenticated users" ON public.forum_comments;
DROP POLICY IF EXISTS "Forum comments can be updated by their authors" ON public.forum_comments;
DROP POLICY IF EXISTS "Forum comments can be deleted by their authors" ON public.forum_comments;

DROP POLICY IF EXISTS "Users can create their own comments" ON public.story_comments;
