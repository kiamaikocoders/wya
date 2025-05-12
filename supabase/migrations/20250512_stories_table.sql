
-- Create stories table
CREATE TABLE IF NOT EXISTS public.stories (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  event_id INTEGER REFERENCES public.events(id),
  caption TEXT NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add Row Level Security (RLS)
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing stories (public)
CREATE POLICY "Stories are viewable by everyone" ON public.stories
  FOR SELECT USING (true);

-- Create policy for creating stories
CREATE POLICY "Users can create their own stories" ON public.stories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policy for updating stories
CREATE POLICY "Users can update their own stories" ON public.stories
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policy for deleting stories
CREATE POLICY "Users can delete their own stories" ON public.stories
  FOR DELETE USING (auth.uid() = user_id);

