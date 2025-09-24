-- Storage Buckets and Enhanced Engagement System
-- This migration creates storage buckets and implements the "Looking Busy" engagement features

-- ==============================================
-- STORAGE BUCKETS SETUP
-- ==============================================

-- Create storage buckets for different media types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
('media', 'media', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']),
('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
('event-images', 'event-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
('stories', 'stories', true, 104857600, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']),
('throwbacks', 'throwbacks', true, 104857600, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']),
('community-content', 'community-content', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']);

-- ==============================================
-- ENHANCED ENGAGEMENT TABLES
-- ==============================================

-- Throwback content for past events
CREATE TABLE IF NOT EXISTS public.throwback_content (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id INTEGER REFERENCES public.events(id) ON DELETE CASCADE,
  original_story_id INTEGER REFERENCES public.stories(id),
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  throwback_date DATE NOT NULL, -- The original event date
  tags TEXT[],
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community posts (general discussion, not event-specific)
CREATE TABLE IF NOT EXISTS public.community_posts (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  category TEXT NOT NULL, -- 'general', 'tips', 'culture', 'trending'
  location TEXT,
  tags TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community post comments
CREATE TABLE IF NOT EXISTS public.community_post_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_comment_id INTEGER REFERENCES public.community_post_comments(id),
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Community post likes
CREATE TABLE IF NOT EXISTS public.community_post_likes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Community post comment likes
CREATE TABLE IF NOT EXISTS public.community_post_comment_likes (
  id SERIAL PRIMARY KEY,
  comment_id INTEGER REFERENCES public.community_post_comments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(comment_id, user_id)
);

-- Top moments curation
CREATE TABLE IF NOT EXISTS public.top_moments (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES public.events(id) ON DELETE CASCADE,
  story_id INTEGER REFERENCES public.stories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  rank_position INTEGER NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Event teasers and previews
CREATE TABLE IF NOT EXISTS public.event_teasers (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  teaser_type TEXT NOT NULL, -- 'preview', 'hype_reel', 'early_bird', 'countdown'
  release_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Featured organizers and venues
CREATE TABLE IF NOT EXISTS public.featured_creators (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  venue_id INTEGER, -- Could reference a venues table if created
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT,
  feature_type TEXT NOT NULL, -- 'organizer', 'venue', 'artist', 'influencer'
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Local tips and culture content
CREATE TABLE IF NOT EXISTS public.local_tips (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT CHECK (media_type IN ('image', 'video')),
  tip_type TEXT NOT NULL, -- 'bar', 'restaurant', 'venue', 'activity', 'trend'
  location TEXT,
  tags TEXT[],
  likes_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User engagement tracking
CREATE TABLE IF NOT EXISTS public.user_engagement (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL, -- 'story', 'post', 'comment', 'like'
  content_id INTEGER NOT NULL,
  engagement_type TEXT NOT NULL, -- 'view', 'like', 'comment', 'share'
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- RLS POLICIES FOR ENGAGEMENT TABLES
-- ==============================================

-- Throwback content RLS
ALTER TABLE public.throwback_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Throwback content is viewable by everyone" ON public.throwback_content
  FOR SELECT USING (true);

CREATE POLICY "Users can create throwback content" ON public.throwback_content
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own throwback content" ON public.throwback_content
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own throwback content" ON public.throwback_content
  FOR DELETE USING (auth.uid() = user_id);

-- Community posts RLS
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community posts are viewable by everyone" ON public.community_posts
  FOR SELECT USING (true);

CREATE POLICY "Users can create community posts" ON public.community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own community posts" ON public.community_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own community posts" ON public.community_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Community post comments RLS
ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community post comments are viewable by everyone" ON public.community_post_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create community post comments" ON public.community_post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own community post comments" ON public.community_post_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own community post comments" ON public.community_post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Community post likes RLS
ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community post likes are viewable by everyone" ON public.community_post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create community post likes" ON public.community_post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own community post likes" ON public.community_post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Community post comment likes RLS
ALTER TABLE public.community_post_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Community post comment likes are viewable by everyone" ON public.community_post_comment_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create community post comment likes" ON public.community_post_comment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own community post comment likes" ON public.community_post_comment_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Top moments RLS
ALTER TABLE public.top_moments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Top moments are viewable by everyone" ON public.top_moments
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage top moments" ON public.top_moments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND username = 'admin'
    )
  );

-- Event teasers RLS
ALTER TABLE public.event_teasers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event teasers are viewable by everyone" ON public.event_teasers
  FOR SELECT USING (true);

CREATE POLICY "Event organizers can manage their teasers" ON public.event_teasers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id AND e.organizer_id = auth.uid()::text
    )
  );

-- Featured creators RLS
ALTER TABLE public.featured_creators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Featured creators are viewable by everyone" ON public.featured_creators
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage featured creators" ON public.featured_creators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND username = 'admin'
    )
  );

-- Local tips RLS
ALTER TABLE public.local_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Local tips are viewable by everyone" ON public.local_tips
  FOR SELECT USING (true);

CREATE POLICY "Users can create local tips" ON public.local_tips
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own local tips" ON public.local_tips
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own local tips" ON public.local_tips
  FOR DELETE USING (auth.uid() = user_id);

-- User engagement RLS
ALTER TABLE public.user_engagement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own engagement" ON public.user_engagement
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create engagement records" ON public.user_engagement
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==============================================
-- ENGAGEMENT FUNCTIONS
-- ==============================================

-- Function to create throwback content
CREATE OR REPLACE FUNCTION public.create_throwback_content(
  p_event_id INTEGER,
  p_original_story_id INTEGER,
  p_title TEXT,
  p_description TEXT,
  p_media_url TEXT,
  p_media_type TEXT,
  p_throwback_date DATE,
  p_tags TEXT[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  throwback_id INTEGER;
  result JSON;
BEGIN
  INSERT INTO public.throwback_content (
    user_id, event_id, original_story_id, title, description,
    media_url, media_type, throwback_date, tags
  ) VALUES (
    auth.uid(), p_event_id, p_original_story_id, p_title, p_description,
    p_media_url, p_media_type, p_throwback_date, p_tags
  ) RETURNING id INTO throwback_id;

  SELECT json_build_object(
    'success', TRUE,
    'throwback_id', throwback_id,
    'created_at', NOW()
  ) INTO result;

  RETURN result;
END;
$$;

-- Function to get trending content
CREATE OR REPLACE FUNCTION public.get_trending_content(
  p_content_type TEXT DEFAULT 'all',
  p_limit INTEGER DEFAULT 20
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  trending_content JSON;
BEGIN
  WITH content_scores AS (
    -- Stories with engagement
    SELECT 
      'story' as content_type,
      s.id as content_id,
      s.content as title,
      s.media_url,
      s.media_type,
      s.likes_count + s.comments_count as engagement_score,
      s.created_at,
      p.username,
      p.avatar_url
    FROM public.stories s
    JOIN public.profiles p ON p.id = s.user_id
    WHERE s.created_at > NOW() - INTERVAL '7 days'
    
    UNION ALL
    
    -- Community posts with engagement
    SELECT 
      'community_post' as content_type,
      cp.id as content_id,
      cp.title,
      cp.media_url,
      cp.media_type,
      cp.likes_count + cp.comments_count + cp.views_count as engagement_score,
      cp.created_at,
      p.username,
      p.avatar_url
    FROM public.community_posts cp
    JOIN public.profiles p ON p.id = cp.user_id
    WHERE cp.created_at > NOW() - INTERVAL '7 days'
    
    UNION ALL
    
    -- Local tips with engagement
    SELECT 
      'local_tip' as content_type,
      lt.id as content_id,
      lt.title,
      lt.media_url,
      lt.media_type,
      lt.likes_count + lt.views_count as engagement_score,
      lt.created_at,
      p.username,
      p.avatar_url
    FROM public.local_tips lt
    JOIN public.profiles p ON p.id = lt.user_id
    WHERE lt.created_at > NOW() - INTERVAL '7 days'
  )
  SELECT json_agg(
    json_build_object(
      'content_type', content_type,
      'content_id', content_id,
      'title', title,
      'media_url', media_url,
      'media_type', media_type,
      'engagement_score', engagement_score,
      'created_at', created_at,
      'username', username,
      'avatar_url', avatar_url
    )
  ) INTO trending_content
  FROM content_scores
  WHERE (p_content_type = 'all' OR content_type = p_content_type)
  ORDER BY engagement_score DESC, created_at DESC
  LIMIT p_limit;

  RETURN COALESCE(trending_content, '[]'::json);
END;
$$;

-- Function to get "What Went Down" content
CREATE OR REPLACE FUNCTION public.get_what_went_down_content(
  p_hours_back INTEGER DEFAULT 24
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  content JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'event_id', e.id,
      'event_title', e.title,
      'event_date', e.date,
      'stories_count', COALESCE(story_stats.stories_count, 0),
      'total_likes', COALESCE(story_stats.total_likes, 0),
      'top_stories', COALESCE(story_stats.top_stories, '[]'::json)
    )
  ) INTO content
  FROM public.events e
  LEFT JOIN (
    SELECT 
      s.event_id,
      COUNT(*) as stories_count,
      SUM(s.likes_count) as total_likes,
      json_agg(
        json_build_object(
          'id', s.id,
          'content', s.content,
          'media_url', s.media_url,
          'likes_count', s.likes_count,
          'username', p.username,
          'avatar_url', p.avatar_url
        )
      ) as top_stories
    FROM public.stories s
    JOIN public.profiles p ON p.id = s.user_id
    WHERE s.created_at > NOW() - (p_hours_back || ' hours')::INTERVAL
    GROUP BY s.event_id
  ) story_stats ON story_stats.event_id = e.id
  WHERE e.date < NOW() 
  AND e.date > NOW() - (p_hours_back || ' hours')::INTERVAL
  ORDER BY story_stats.total_likes DESC;

  RETURN COALESCE(content, '[]'::json);
END;
$$;

-- Function to get upcoming event teasers
CREATE OR REPLACE FUNCTION public.get_upcoming_teasers(
  p_days_ahead INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  teasers JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'teaser_id', et.id,
      'event_id', et.event_id,
      'event_title', e.title,
      'event_date', e.date,
      'teaser_title', et.title,
      'teaser_description', et.description,
      'media_url', et.media_url,
      'media_type', et.media_type,
      'teaser_type', et.teaser_type,
      'release_date', et.release_date
    )
  ) INTO teasers
  FROM public.event_teasers et
  JOIN public.events e ON e.id = et.event_id
  WHERE et.is_active = TRUE
  AND e.date > NOW()
  AND e.date < NOW() + (p_days_ahead || ' days')::INTERVAL
  ORDER BY et.release_date ASC, e.date ASC;

  RETURN COALESCE(teasers, '[]'::json);
END;
$$;

-- Function to get featured creators
CREATE OR REPLACE FUNCTION public.get_featured_creators()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  creators JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'creator_id', fc.id,
      'user_id', fc.user_id,
      'title', fc.title,
      'description', fc.description,
      'media_url', fc.media_url,
      'feature_type', fc.feature_type,
      'username', p.username,
      'avatar_url', p.avatar_url,
      'start_date', fc.start_date,
      'end_date', fc.end_date
    )
  ) INTO creators
  FROM public.featured_creators fc
  JOIN public.profiles p ON p.id = fc.user_id
  WHERE fc.is_active = TRUE
  AND (fc.end_date IS NULL OR fc.end_date > NOW())
  ORDER BY fc.start_date DESC;

  RETURN COALESCE(creators, '[]'::json);
END;
$$;

-- Function to track user engagement
CREATE OR REPLACE FUNCTION public.track_engagement(
  p_content_type TEXT,
  p_content_id INTEGER,
  p_engagement_type TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_engagement (
    user_id, content_type, content_id, engagement_type, metadata
  ) VALUES (
    auth.uid(), p_content_type, p_content_id, p_engagement_type, p_metadata
  );
END;
$$;

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Throwback content indexes
CREATE INDEX IF NOT EXISTS idx_throwback_content_event_id ON public.throwback_content(event_id);
CREATE INDEX IF NOT EXISTS idx_throwback_content_user_id ON public.throwback_content(user_id);
CREATE INDEX IF NOT EXISTS idx_throwback_content_throwback_date ON public.throwback_content(throwback_date);
CREATE INDEX IF NOT EXISTS idx_throwback_content_is_featured ON public.throwback_content(is_featured);

-- Community posts indexes
CREATE INDEX IF NOT EXISTS idx_community_posts_user_id ON public.community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_category ON public.community_posts(category);
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_community_posts_is_featured ON public.community_posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_community_posts_is_pinned ON public.community_posts(is_pinned);

-- Community post comments indexes
CREATE INDEX IF NOT EXISTS idx_community_post_comments_post_id ON public.community_post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_comments_user_id ON public.community_post_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_community_post_comments_parent_comment_id ON public.community_post_comments(parent_comment_id);

-- Community post likes indexes
CREATE INDEX IF NOT EXISTS idx_community_post_likes_post_id ON public.community_post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_community_post_likes_user_id ON public.community_post_likes(user_id);

-- Top moments indexes
CREATE INDEX IF NOT EXISTS idx_top_moments_event_id ON public.top_moments(event_id);
CREATE INDEX IF NOT EXISTS idx_top_moments_rank_position ON public.top_moments(rank_position);
CREATE INDEX IF NOT EXISTS idx_top_moments_is_featured ON public.top_moments(is_featured);

-- Event teasers indexes
CREATE INDEX IF NOT EXISTS idx_event_teasers_event_id ON public.event_teasers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_teasers_teaser_type ON public.event_teasers(teaser_type);
CREATE INDEX IF NOT EXISTS idx_event_teasers_is_active ON public.event_teasers(is_active);

-- Featured creators indexes
CREATE INDEX IF NOT EXISTS idx_featured_creators_user_id ON public.featured_creators(user_id);
CREATE INDEX IF NOT EXISTS idx_featured_creators_feature_type ON public.featured_creators(feature_type);
CREATE INDEX IF NOT EXISTS idx_featured_creators_is_active ON public.featured_creators(is_active);

-- Local tips indexes
CREATE INDEX IF NOT EXISTS idx_local_tips_user_id ON public.local_tips(user_id);
CREATE INDEX IF NOT EXISTS idx_local_tips_tip_type ON public.local_tips(tip_type);
CREATE INDEX IF NOT EXISTS idx_local_tips_is_featured ON public.local_tips(is_featured);

-- User engagement indexes
CREATE INDEX IF NOT EXISTS idx_user_engagement_user_id ON public.user_engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_user_engagement_content_type ON public.user_engagement(content_type);
CREATE INDEX IF NOT EXISTS idx_user_engagement_engagement_type ON public.user_engagement(engagement_type);
CREATE INDEX IF NOT EXISTS idx_user_engagement_created_at ON public.user_engagement(created_at);
