-- Fix Forum Posts Foreign Key Relationships
-- This migration fixes the missing foreign key relationships for forum_posts

-- ==============================================
-- FIX FORUM POSTS FOREIGN KEY RELATIONSHIPS
-- ==============================================

-- Add foreign key constraint for forum_posts.user_id -> profiles.id
ALTER TABLE public.forum_posts 
ADD CONSTRAINT forum_posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key constraint for forum_comments.user_id -> profiles.id
ALTER TABLE public.forum_comments 
ADD CONSTRAINT forum_comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add foreign key constraint for forum_comments.post_id -> forum_posts.id
ALTER TABLE public.forum_comments 
ADD CONSTRAINT forum_comments_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.forum_posts(id) ON DELETE CASCADE;

-- ==============================================
-- ADD MISSING FORUM POSTS COLUMNS
-- ==============================================

-- Add missing columns to forum_posts if they don't exist
DO $$ 
BEGIN
    -- Add user_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'forum_posts' AND column_name = 'user_id') THEN
        ALTER TABLE public.forum_posts ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
    
    -- Add likes_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'forum_posts' AND column_name = 'likes_count') THEN
        ALTER TABLE public.forum_posts ADD COLUMN likes_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add comments_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'forum_posts' AND column_name = 'comments_count') THEN
        ALTER TABLE public.forum_posts ADD COLUMN comments_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add views_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'forum_posts' AND column_name = 'views_count') THEN
        ALTER TABLE public.forum_posts ADD COLUMN views_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add category column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'forum_posts' AND column_name = 'category') THEN
        ALTER TABLE public.forum_posts ADD COLUMN category TEXT DEFAULT 'general';
    END IF;
    
    -- Add location column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'forum_posts' AND column_name = 'location') THEN
        ALTER TABLE public.forum_posts ADD COLUMN location TEXT;
    END IF;
    
    -- Add tags column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'forum_posts' AND column_name = 'tags') THEN
        ALTER TABLE public.forum_posts ADD COLUMN tags TEXT[];
    END IF;
    
    -- Add is_pinned column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'forum_posts' AND column_name = 'is_pinned') THEN
        ALTER TABLE public.forum_posts ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Add is_featured column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'forum_posts' AND column_name = 'is_featured') THEN
        ALTER TABLE public.forum_posts ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- ==============================================
-- CREATE FORUM POST LIKES TABLE
-- ==============================================

-- Create forum post likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.forum_post_likes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- ==============================================
-- RLS POLICIES FOR FORUM POST LIKES
-- ==============================================

-- Enable RLS on forum post likes
ALTER TABLE public.forum_post_likes ENABLE ROW LEVEL SECURITY;

-- Users can view all forum post likes
CREATE POLICY "Forum post likes are viewable by everyone" ON public.forum_post_likes
  FOR SELECT USING (true);

-- Users can create forum post likes
CREATE POLICY "Users can create forum post likes" ON public.forum_post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own forum post likes
CREATE POLICY "Users can delete their own forum post likes" ON public.forum_post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- ==============================================
-- FUNCTIONS FOR FORUM POST ENGAGEMENT
-- ==============================================

-- Function to like a forum post
CREATE OR REPLACE FUNCTION public.like_forum_post(p_post_id INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Insert like if it doesn't exist
  INSERT INTO public.forum_post_likes (post_id, user_id)
  VALUES (p_post_id, auth.uid())
  ON CONFLICT (post_id, user_id) DO NOTHING;

  -- Update likes count
  UPDATE public.forum_posts 
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = p_post_id;

  -- Return success response
  SELECT json_build_object(
    'success', TRUE,
    'post_id', p_post_id,
    'liked_at', NOW()
  ) INTO result;

  RETURN result;
END;
$$;

-- Function to unlike a forum post
CREATE OR REPLACE FUNCTION public.unlike_forum_post(p_post_id INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Delete like
  DELETE FROM public.forum_post_likes 
  WHERE post_id = p_post_id AND user_id = auth.uid();

  -- Update likes count
  UPDATE public.forum_posts 
  SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
  WHERE id = p_post_id;

  -- Return success response
  SELECT json_build_object(
    'success', TRUE,
    'post_id', p_post_id,
    'unliked_at', NOW()
  ) INTO result;

  RETURN result;
END;
$$;

-- Function to increment forum post views
CREATE OR REPLACE FUNCTION public.increment_forum_post_views(p_post_id INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.forum_posts 
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = p_post_id;
END;
$$;

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Forum posts indexes
CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id ON public.forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_event_id ON public.forum_posts(event_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON public.forum_posts(category);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON public.forum_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_forum_posts_likes_count ON public.forum_posts(likes_count);
CREATE INDEX IF NOT EXISTS idx_forum_posts_is_featured ON public.forum_posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_forum_posts_is_pinned ON public.forum_posts(is_pinned);

-- Forum post likes indexes
CREATE INDEX IF NOT EXISTS idx_forum_post_likes_post_id ON public.forum_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_post_likes_user_id ON public.forum_post_likes(user_id);

-- Forum comments indexes
CREATE INDEX IF NOT EXISTS idx_forum_comments_post_id ON public.forum_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_user_id ON public.forum_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_created_at ON public.forum_comments(created_at);
