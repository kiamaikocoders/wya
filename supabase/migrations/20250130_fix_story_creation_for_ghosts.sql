-- Fix Story Creation for Ghost Users
-- Ensure stories created by ghost users are visible and properly linked

-- Update stories RLS to ensure all stories are viewable
DROP POLICY IF EXISTS "Stories are viewable by everyone" ON public.stories;

CREATE POLICY "Stories are viewable by everyone" ON public.stories
  FOR SELECT 
  USING (true);

-- Ensure INSERT policy allows service role operations (ghost user creation)
DROP POLICY IF EXISTS "Users can create their own stories" ON public.stories;

CREATE POLICY "Users can create their own stories" ON public.stories
  FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id OR
    -- Allow service role to create stories for any user (ghost users)
    EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id)
  );

-- Add index on event_id for faster queries
CREATE INDEX IF NOT EXISTS idx_stories_event_id ON public.stories(event_id) WHERE event_id IS NOT NULL;

-- Add index on user_id for faster profile lookups
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);

-- Add index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at DESC);
