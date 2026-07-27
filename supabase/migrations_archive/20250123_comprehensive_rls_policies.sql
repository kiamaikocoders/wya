-- Comprehensive RLS Policies for All Tables
-- This migration adds proper Row Level Security to all tables
-- Note: Policies are only created for tables that exist

-- ==============================================
-- EVENTS TABLE RLS POLICIES
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
    ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Events are viewable by everyone" ON public.events
      FOR SELECT USING (true);

    CREATE POLICY "Authenticated users can create events" ON public.events
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

    CREATE POLICY "Users can update their own events" ON public.events
      FOR UPDATE USING (auth.uid() = organizer_id);

    CREATE POLICY "Users can delete their own events" ON public.events
      FOR DELETE USING (auth.uid() = organizer_id);

-- Admins can do everything
    CREATE POLICY "Admins can manage all events" ON public.events
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND username = 'admin'
        )
      );
  END IF;
END $$;

-- ==============================================
-- PROFILES TABLE RLS POLICIES
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
      FOR SELECT USING (true);

    CREATE POLICY "Users can create their own profile" ON public.profiles
      FOR INSERT WITH CHECK (auth.uid() = id);

    CREATE POLICY "Users can update their own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = id);

-- Users can delete their own profile
    CREATE POLICY "Users can delete their own profile" ON public.profiles
      FOR DELETE USING (auth.uid() = id);
  END IF;
END $$;

-- ==============================================
-- TICKETS TABLE RLS POLICIES
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tickets') THEN
    ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view their own tickets" ON public.tickets
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can create tickets" ON public.tickets
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own tickets" ON public.tickets
      FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own tickets
    CREATE POLICY "Users can delete their own tickets" ON public.tickets
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ==============================================
-- PAYMENTS TABLE RLS POLICIES
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
    ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

    -- Users can view their own payments
    CREATE POLICY "Users can view their own payments" ON public.payments
      FOR SELECT USING (auth.uid() = user_id);

    -- Users can create payments
    CREATE POLICY "Users can create payments" ON public.payments
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    -- Users can update their own payments
    CREATE POLICY "Users can update their own payments" ON public.payments
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ==============================================
-- NOTIFICATIONS TABLE RLS POLICIES
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notifications') THEN
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view their own notifications" ON public.notifications
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "System can create notifications" ON public.notifications
      FOR INSERT WITH CHECK (true);

    CREATE POLICY "Users can update their own notifications" ON public.notifications
      FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own notifications" ON public.notifications
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ==============================================
-- FORUM POSTS TABLE RLS POLICIES
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'forum_posts') THEN
    ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Forum posts are viewable by everyone" ON public.forum_posts
      FOR SELECT USING (true);

    CREATE POLICY "Authenticated users can create forum posts" ON public.forum_posts
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

    CREATE POLICY "Users can update their own forum posts" ON public.forum_posts
      FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own posts
    CREATE POLICY "Users can delete their own forum posts" ON public.forum_posts
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ==============================================
-- FORUM COMMENTS TABLE RLS POLICIES
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'forum_comments') THEN
    ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Forum comments are viewable by everyone" ON public.forum_comments
      FOR SELECT USING (true);

    CREATE POLICY "Authenticated users can create forum comments" ON public.forum_comments
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

    CREATE POLICY "Users can update their own forum comments" ON public.forum_comments
      FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own comments
    CREATE POLICY "Users can delete their own forum comments" ON public.forum_comments
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ==============================================
-- MESSAGES TABLE RLS POLICIES
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN
    ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view their messages" ON public.messages
      FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
      );

    CREATE POLICY "Users can create messages" ON public.messages
      FOR INSERT WITH CHECK (auth.uid() = sender_id);

    CREATE POLICY "Users can update their own messages" ON public.messages
      FOR UPDATE USING (auth.uid() = sender_id);

-- Users can delete their own messages
    CREATE POLICY "Users can delete their own messages" ON public.messages
      FOR DELETE USING (auth.uid() = sender_id);
  END IF;
END $$;

-- ==============================================
-- FAVORITES TABLE RLS POLICIES
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorites') THEN
    ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view their own favorites" ON public.favorites
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can create favorites" ON public.favorites
      FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
    CREATE POLICY "Users can delete their own favorites" ON public.favorites
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ==============================================
-- FOLLOWS TABLE RLS POLICIES
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'follows') THEN
    ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Follows are viewable by everyone" ON public.follows
      FOR SELECT USING (true);

    CREATE POLICY "Users can create follows" ON public.follows
      FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can delete their own follows
    CREATE POLICY "Users can delete their own follows" ON public.follows
      FOR DELETE USING (auth.uid() = follower_id);
  END IF;
END $$;

-- ==============================================
-- STORIES TABLE RLS POLICIES (COMPLETE)
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stories') THEN
    ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can create their own stories" ON public.stories
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own stories" ON public.stories
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ==============================================
-- SURVEYS TABLE RLS POLICIES
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'surveys') THEN
    ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Surveys are viewable by everyone" ON public.surveys
      FOR SELECT USING (true);

    CREATE POLICY "Authenticated users can create surveys" ON public.surveys
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

    CREATE POLICY "Users can update their own surveys" ON public.surveys
      FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own surveys" ON public.surveys
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ==============================================
-- SURVEY RESPONSES TABLE RLS POLICIES
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'survey_responses') THEN
    ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Users can view their own survey responses" ON public.survey_responses
      FOR SELECT USING (auth.uid() = user_id);

    CREATE POLICY "Users can create survey responses" ON public.survey_responses
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own survey responses" ON public.survey_responses
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ==============================================
-- SPONSORS TABLE RLS POLICIES
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sponsors') THEN
    ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Sponsors are viewable by everyone" ON public.sponsors
      FOR SELECT USING (true);

    CREATE POLICY "Admins can manage sponsors" ON public.sponsors
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND username = 'admin'
        )
      );
  END IF;
END $$;

-- ==============================================
-- POST LIKES TABLE RLS POLICIES
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'post_likes') THEN
    ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Post likes are viewable by everyone" ON public.post_likes
      FOR SELECT USING (true);

    CREATE POLICY "Users can create post likes" ON public.post_likes
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own post likes" ON public.post_likes
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ==============================================
-- STORY LIKES TABLE RLS POLICIES
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'story_likes') THEN
    ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Story likes are viewable by everyone" ON public.story_likes
      FOR SELECT USING (true);

    CREATE POLICY "Users can create story likes" ON public.story_likes
      FOR INSERT WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own story likes" ON public.story_likes
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ==============================================
-- STORY COMMENTS TABLE RLS POLICIES
-- ==============================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'story_comments') THEN
    ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "Story comments are viewable by everyone" ON public.story_comments
      FOR SELECT USING (true);

    CREATE POLICY "Authenticated users can create story comments" ON public.story_comments
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

    CREATE POLICY "Users can update their own story comments" ON public.story_comments
      FOR UPDATE USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own story comments" ON public.story_comments
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
