-- Ghost User System Migration
-- This migration creates tables and policies for managing ghost accounts
-- Ghost accounts are programmatically created accounts used to boost platform engagement

-- ==============================================
-- ADD IS_GHOST FLAG TO PROFILES
-- ==============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_ghost'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_ghost BOOLEAN DEFAULT FALSE;
    CREATE INDEX IF NOT EXISTS idx_profiles_is_ghost ON public.profiles(is_ghost);
  END IF;
END $$;

-- ==============================================
-- GHOST PERSONA GROUPS TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.ghost_persona_groups (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  engagement_rate DECIMAL(3,2) DEFAULT 0.85, -- 85% participation rate
  content_creation_rate DECIMAL(3,2) DEFAULT 0.30, -- 30% create content
  like_probability DECIMAL(3,2) DEFAULT 0.70, -- 70% chance to like
  share_probability DECIMAL(3,2) DEFAULT 0.20, -- 20% chance to share
  comment_probability DECIMAL(3,2) DEFAULT 0.15, -- 15% chance to comment
  min_delay_seconds INTEGER DEFAULT 2,
  max_delay_seconds INTEGER DEFAULT 60,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- GHOST ACTION QUEUE TABLE
-- ==============================================
CREATE TABLE IF NOT EXISTS public.ghost_action_queue (
  id SERIAL PRIMARY KEY,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'like_story', 
    'like_post', 
    'like_community_post',
    'comment_story',
    'comment_post',
    'comment_community_post',
    'create_story',
    'create_post',
    'create_community_post',
    'follow_user'
  )),
  target_id INTEGER, -- story_id, post_id, event_id, user_id
  target_type TEXT NOT NULL CHECK (target_type IN ('story', 'forum_post', 'community_post', 'event', 'user')),
  persona_group_id INTEGER REFERENCES public.ghost_persona_groups(id),
  ghost_user_ids UUID[], -- specific ghost users, or NULL for all in persona group
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  metadata JSONB, -- Additional data like content for posts/stories
  created_by UUID REFERENCES auth.users(id),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- GHOST ACTION LOG TABLE (Audit Trail)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.ghost_action_log (
  id SERIAL PRIMARY KEY,
  queue_id INTEGER REFERENCES public.ghost_action_queue(id),
  ghost_user_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL,
  target_id INTEGER,
  target_type TEXT NOT NULL,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================
CREATE INDEX IF NOT EXISTS idx_ghost_action_queue_status ON public.ghost_action_queue(status);
CREATE INDEX IF NOT EXISTS idx_ghost_action_queue_scheduled_at ON public.ghost_action_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_ghost_action_queue_persona_group ON public.ghost_action_queue(persona_group_id);
CREATE INDEX IF NOT EXISTS idx_ghost_action_log_queue_id ON public.ghost_action_log(queue_id);
CREATE INDEX IF NOT EXISTS idx_ghost_action_log_ghost_user_id ON public.ghost_action_log(ghost_user_id);
CREATE INDEX IF NOT EXISTS idx_ghost_action_log_executed_at ON public.ghost_action_log(executed_at);

-- ==============================================
-- RLS POLICIES
-- ==============================================

-- Ghost persona groups: Only admins can manage
ALTER TABLE public.ghost_persona_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ghost persona groups are viewable by everyone" 
  ON public.ghost_persona_groups FOR SELECT USING (true);

CREATE POLICY "Only admins can manage ghost persona groups" 
  ON public.ghost_persona_groups FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND username = 'admin'
    )
  );

-- Ghost action queue: Only admins can create/manage
ALTER TABLE public.ghost_action_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view ghost action queue" 
  ON public.ghost_action_queue FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND username = 'admin'
    )
  );

CREATE POLICY "Admins can create ghost actions" 
  ON public.ghost_action_queue FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND username = 'admin'
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Admins can update ghost actions" 
  ON public.ghost_action_queue FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND username = 'admin'
    )
  );

CREATE POLICY "Admins can delete ghost actions" 
  ON public.ghost_action_queue FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND username = 'admin'
    )
  );

-- Ghost action log: Only admins can view
ALTER TABLE public.ghost_action_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view ghost action log" 
  ON public.ghost_action_log FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND username = 'admin'
    )
  );

-- ==============================================
-- FUNCTIONS
-- ==============================================

-- Function to get ghost users by persona group
CREATE OR REPLACE FUNCTION public.get_ghost_users_by_persona(
  p_persona_group_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  full_name TEXT,
  persona_group_id INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    COALESCE(pg.id, NULL)::INTEGER as persona_group_id
  FROM public.profiles p
  LEFT JOIN public.ghost_persona_groups pg ON pg.id = p_persona_group_id
  WHERE p.is_ghost = TRUE
  AND (p_persona_group_id IS NULL OR pg.id = p_persona_group_id)
  ORDER BY p.created_at;
END;
$$;

-- Function to update ghost action queue status
CREATE OR REPLACE FUNCTION public.update_ghost_action_status(
  p_queue_id INTEGER,
  p_status TEXT,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.ghost_action_queue
  SET 
    status = p_status,
    executed_at = CASE WHEN p_status IN ('completed', 'failed') THEN NOW() ELSE executed_at END,
    error_message = COALESCE(p_error_message, error_message),
    updated_at = NOW()
  WHERE id = p_queue_id;
END;
$$;

-- Function to log ghost action execution
CREATE OR REPLACE FUNCTION public.log_ghost_action(
  p_queue_id INTEGER,
  p_ghost_user_id UUID,
  p_action_type TEXT,
  p_target_id INTEGER,
  p_target_type TEXT,
  p_success BOOLEAN,
  p_error_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.ghost_action_log (
    queue_id,
    ghost_user_id,
    action_type,
    target_id,
    target_type,
    success,
    error_message
  ) VALUES (
    p_queue_id,
    p_ghost_user_id,
    p_action_type,
    p_target_id,
    p_target_type,
    p_success,
    p_error_message
  );
END;
$$;

-- ==============================================
-- INSERT DEFAULT PERSONA GROUPS
-- ==============================================
INSERT INTO public.ghost_persona_groups (name, description, engagement_rate, content_creation_rate, like_probability, share_probability, comment_probability, min_delay_seconds, max_delay_seconds) VALUES
('highly_active', 'Highly active users who engage frequently', 0.95, 0.50, 0.85, 0.30, 0.25, 1, 15),
('moderately_active', 'Moderately active users with balanced engagement', 0.85, 0.30, 0.70, 0.20, 0.15, 2, 30),
('casual_users', 'Casual users with occasional engagement', 0.70, 0.15, 0.55, 0.10, 0.08, 5, 60),
('content_creators', 'Users who primarily create content', 0.80, 0.80, 0.60, 0.25, 0.20, 3, 45),
('lurkers', 'Users who mostly view and rarely engage', 0.50, 0.05, 0.30, 0.05, 0.03, 10, 120)
ON CONFLICT (name) DO NOTHING;
