-- Comprehensive RLS Policies for All Tables
-- This migration adds proper Row Level Security to all tables

-- ==============================================
-- EVENTS TABLE RLS POLICIES
-- ==============================================
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Anyone can view events
CREATE POLICY "Events are viewable by everyone" ON public.events
  FOR SELECT USING (true);

-- Authenticated users can create events
CREATE POLICY "Authenticated users can create events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own events
CREATE POLICY "Users can update their own events" ON public.events
  FOR UPDATE USING (auth.uid() = organizer_id);

-- Users can delete their own events
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

-- ==============================================
-- PROFILES TABLE RLS POLICIES
-- ==============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can view all profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can create their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Users can delete their own profile
CREATE POLICY "Users can delete their own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- ==============================================
-- TICKETS TABLE RLS POLICIES
-- ==============================================
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Users can view their own tickets
CREATE POLICY "Users can view their own tickets" ON public.tickets
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create tickets
CREATE POLICY "Users can create tickets" ON public.tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own tickets
CREATE POLICY "Users can update their own tickets" ON public.tickets
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own tickets
CREATE POLICY "Users can delete their own tickets" ON public.tickets
  FOR DELETE USING (auth.uid() = user_id);

-- ==============================================
-- PAYMENTS TABLE RLS POLICIES
-- ==============================================
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

-- ==============================================
-- NOTIFICATIONS TABLE RLS POLICIES
-- ==============================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid()::text = user_id);

-- System can create notifications
CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Users can update their own notifications
CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (auth.uid()::text = user_id);

-- ==============================================
-- FORUM POSTS TABLE RLS POLICIES
-- ==============================================
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

-- Everyone can view forum posts
CREATE POLICY "Forum posts are viewable by everyone" ON public.forum_posts
  FOR SELECT USING (true);

-- Authenticated users can create posts
CREATE POLICY "Authenticated users can create forum posts" ON public.forum_posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own posts
CREATE POLICY "Users can update their own forum posts" ON public.forum_posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete their own forum posts" ON public.forum_posts
  FOR DELETE USING (auth.uid() = user_id);

-- ==============================================
-- FORUM COMMENTS TABLE RLS POLICIES
-- ==============================================
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;

-- Everyone can view forum comments
CREATE POLICY "Forum comments are viewable by everyone" ON public.forum_comments
  FOR SELECT USING (true);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create forum comments" ON public.forum_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own comments
CREATE POLICY "Users can update their own forum comments" ON public.forum_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own forum comments" ON public.forum_comments
  FOR DELETE USING (auth.uid() = user_id);

-- ==============================================
-- MESSAGES TABLE RLS POLICIES
-- ==============================================
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages they sent or received
CREATE POLICY "Users can view their messages" ON public.messages
  FOR SELECT USING (
    auth.uid()::text = sender_id OR auth.uid()::text = receiver_id
  );

-- Users can create messages
CREATE POLICY "Users can create messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid()::text = sender_id);

-- Users can update their own messages
CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (auth.uid()::text = sender_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages" ON public.messages
  FOR DELETE USING (auth.uid()::text = sender_id);

-- ==============================================
-- FAVORITES TABLE RLS POLICIES
-- ==============================================
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
CREATE POLICY "Users can view their own favorites" ON public.favorites
  FOR SELECT USING (auth.uid()::text = user_id);

-- Users can create favorites
CREATE POLICY "Users can create favorites" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete their own favorites" ON public.favorites
  FOR DELETE USING (auth.uid()::text = user_id);

-- ==============================================
-- FOLLOWS TABLE RLS POLICIES
-- ==============================================
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Users can view all follows
CREATE POLICY "Follows are viewable by everyone" ON public.follows
  FOR SELECT USING (true);

-- Users can create follows
CREATE POLICY "Users can create follows" ON public.follows
  FOR INSERT WITH CHECK (auth.uid()::text = follower_id);

-- Users can delete their own follows
CREATE POLICY "Users can delete their own follows" ON public.follows
  FOR DELETE USING (auth.uid()::text = follower_id);

-- ==============================================
-- STORIES TABLE RLS POLICIES (COMPLETE)
-- ==============================================
-- Enable RLS if not already enabled
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Create missing policies
CREATE POLICY "Users can create their own stories" ON public.stories
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own stories" ON public.stories
  FOR UPDATE USING (auth.uid()::text = user_id);

-- ==============================================
-- SURVEYS TABLE RLS POLICIES
-- ==============================================
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

-- Everyone can view surveys
CREATE POLICY "Surveys are viewable by everyone" ON public.surveys
  FOR SELECT USING (true);

-- Authenticated users can create surveys
CREATE POLICY "Authenticated users can create surveys" ON public.surveys
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own surveys
CREATE POLICY "Users can update their own surveys" ON public.surveys
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Users can delete their own surveys
CREATE POLICY "Users can delete their own surveys" ON public.surveys
  FOR DELETE USING (auth.uid()::text = user_id);

-- ==============================================
-- SURVEY RESPONSES TABLE RLS POLICIES
-- ==============================================
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- Users can view their own responses
CREATE POLICY "Users can view their own survey responses" ON public.survey_responses
  FOR SELECT USING (auth.uid()::text = user_id);

-- Users can create responses
CREATE POLICY "Users can create survey responses" ON public.survey_responses
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own responses
CREATE POLICY "Users can update their own survey responses" ON public.survey_responses
  FOR UPDATE USING (auth.uid()::text = user_id);

-- ==============================================
-- SPONSORS TABLE RLS POLICIES
-- ==============================================
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- Everyone can view sponsors
CREATE POLICY "Sponsors are viewable by everyone" ON public.sponsors
  FOR SELECT USING (true);

-- Only admins can manage sponsors
CREATE POLICY "Admins can manage sponsors" ON public.sponsors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND username = 'admin'
    )
  );

-- ==============================================
-- POST LIKES TABLE RLS POLICIES
-- ==============================================
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Users can view all likes
CREATE POLICY "Post likes are viewable by everyone" ON public.post_likes
  FOR SELECT USING (true);

-- Users can create likes
CREATE POLICY "Users can create post likes" ON public.post_likes
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can delete their own likes
CREATE POLICY "Users can delete their own post likes" ON public.post_likes
  FOR DELETE USING (auth.uid()::text = user_id);

-- ==============================================
-- STORY LIKES TABLE RLS POLICIES
-- ==============================================
ALTER TABLE public.story_likes ENABLE ROW LEVEL SECURITY;

-- Users can view all story likes
CREATE POLICY "Story likes are viewable by everyone" ON public.story_likes
  FOR SELECT USING (true);

-- Users can create story likes
CREATE POLICY "Users can create story likes" ON public.story_likes
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Users can delete their own story likes
CREATE POLICY "Users can delete their own story likes" ON public.story_likes
  FOR DELETE USING (auth.uid()::text = user_id);

-- ==============================================
-- STORY COMMENTS TABLE RLS POLICIES
-- ==============================================
ALTER TABLE public.story_comments ENABLE ROW LEVEL SECURITY;

-- Everyone can view story comments
CREATE POLICY "Story comments are viewable by everyone" ON public.story_comments
  FOR SELECT USING (true);

-- Authenticated users can create story comments
CREATE POLICY "Authenticated users can create story comments" ON public.story_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own story comments
CREATE POLICY "Users can update their own story comments" ON public.story_comments
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Users can delete their own story comments
CREATE POLICY "Users can delete their own story comments" ON public.story_comments
  FOR DELETE USING (auth.uid()::text = user_id);
