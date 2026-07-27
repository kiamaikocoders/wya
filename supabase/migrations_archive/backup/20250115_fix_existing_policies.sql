-- Fix existing policies and apply missing ones
-- This migration handles existing policies and adds missing ones

-- ==============================================
-- DROP EXISTING POLICIES TO AVOID CONFLICTS
-- ==============================================

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Events are viewable by everyone" ON public.events;
DROP POLICY IF EXISTS "Users can create events" ON public.events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;
DROP POLICY IF EXISTS "Admins can manage all events" ON public.events;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can update their own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can delete their own tickets" ON public.tickets;

DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can create payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update their own payments" ON public.payments;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

DROP POLICY IF EXISTS "Forum posts are viewable by everyone" ON public.forum_posts;
DROP POLICY IF EXISTS "Authenticated users can create forum posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Users can update their own forum posts" ON public.forum_posts;
DROP POLICY IF EXISTS "Users can delete their own forum posts" ON public.forum_posts;

DROP POLICY IF EXISTS "Forum comments are viewable by everyone" ON public.forum_comments;
DROP POLICY IF EXISTS "Authenticated users can create forum comments" ON public.forum_comments;
DROP POLICY IF EXISTS "Users can update their own forum comments" ON public.forum_comments;
DROP POLICY IF EXISTS "Users can delete their own forum comments" ON public.forum_comments;

DROP POLICY IF EXISTS "Users can view their messages" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON public.messages;

DROP POLICY IF EXISTS "Users can view their own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can create favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON public.favorites;

DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
DROP POLICY IF EXISTS "Users can create follows" ON public.follows;
DROP POLICY IF EXISTS "Users can delete their own follows" ON public.follows;

DROP POLICY IF EXISTS "Stories are viewable by everyone" ON public.stories;
DROP POLICY IF EXISTS "Users can create their own stories" ON public.stories;
DROP POLICY IF EXISTS "Users can update their own stories" ON public.stories;
DROP POLICY IF EXISTS "Users can delete their own stories" ON public.stories;

DROP POLICY IF EXISTS "Surveys are viewable by everyone" ON public.surveys;
DROP POLICY IF EXISTS "Authenticated users can create surveys" ON public.surveys;
DROP POLICY IF EXISTS "Users can update their own surveys" ON public.surveys;
DROP POLICY IF EXISTS "Users can delete their own surveys" ON public.surveys;

DROP POLICY IF EXISTS "Users can view their own survey responses" ON public.survey_responses;
DROP POLICY IF EXISTS "Users can create survey responses" ON public.survey_responses;
DROP POLICY IF EXISTS "Users can update their own survey responses" ON public.survey_responses;

DROP POLICY IF EXISTS "Sponsors are viewable by everyone" ON public.sponsors;
DROP POLICY IF EXISTS "Admins can manage sponsors" ON public.sponsors;

DROP POLICY IF EXISTS "Post likes are viewable by everyone" ON public.post_likes;
DROP POLICY IF EXISTS "Users can create post likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users can delete their own post likes" ON public.post_likes;

DROP POLICY IF EXISTS "Story likes are viewable by everyone" ON public.story_likes;
DROP POLICY IF EXISTS "Users can create story likes" ON public.story_likes;
DROP POLICY IF EXISTS "Users can delete their own story likes" ON public.story_likes;

DROP POLICY IF EXISTS "Story comments are viewable by everyone" ON public.story_comments;
DROP POLICY IF EXISTS "Authenticated users can create story comments" ON public.story_comments;
DROP POLICY IF EXISTS "Users can update their own story comments" ON public.story_comments;
DROP POLICY IF EXISTS "Users can delete their own story comments" ON public.story_comments;

-- ==============================================
-- RECREATE ALL POLICIES
-- ==============================================

-- Events table policies
CREATE POLICY "Events are viewable by everyone" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own events" ON public.events
  FOR UPDATE USING (auth.uid() = organizer_id);

CREATE POLICY "Users can delete their own events" ON public.events
  FOR DELETE USING (auth.uid() = organizer_id);

CREATE POLICY "Admins can manage all events" ON public.events
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND username = 'admin'
    )
  );

-- Profiles table policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete their own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- Tickets table policies
CREATE POLICY "Users can view their own tickets" ON public.tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets" ON public.tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tickets" ON public.tickets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tickets" ON public.tickets
  FOR DELETE USING (auth.uid() = user_id);

-- Payments table policies
CREATE POLICY "Users can view their own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create payments" ON public.payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments" ON public.payments
  FOR UPDATE USING (auth.uid() = user_id);

-- Notifications table policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "System can create notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.notifications
  FOR DELETE USING (auth.uid()::text = user_id);

-- Forum posts table policies
CREATE POLICY "Forum posts are viewable by everyone" ON public.forum_posts
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create forum posts" ON public.forum_posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own forum posts" ON public.forum_posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forum posts" ON public.forum_posts
  FOR DELETE USING (auth.uid() = user_id);

-- Forum comments table policies
CREATE POLICY "Forum comments are viewable by everyone" ON public.forum_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create forum comments" ON public.forum_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own forum comments" ON public.forum_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forum comments" ON public.forum_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Messages table policies
CREATE POLICY "Users can view their messages" ON public.messages
  FOR SELECT USING (
    auth.uid()::text = sender_id OR auth.uid()::text = receiver_id
  );

CREATE POLICY "Users can create messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid()::text = sender_id);

CREATE POLICY "Users can update their own messages" ON public.messages
  FOR UPDATE USING (auth.uid()::text = sender_id);

CREATE POLICY "Users can delete their own messages" ON public.messages
  FOR DELETE USING (auth.uid()::text = sender_id);

-- Favorites table policies
CREATE POLICY "Users can view their own favorites" ON public.favorites
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create favorites" ON public.favorites
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own favorites" ON public.favorites
  FOR DELETE USING (auth.uid()::text = user_id);

-- Follows table policies
CREATE POLICY "Follows are viewable by everyone" ON public.follows
  FOR SELECT USING (true);

CREATE POLICY "Users can create follows" ON public.follows
  FOR INSERT WITH CHECK (auth.uid()::text = follower_id);

CREATE POLICY "Users can delete their own follows" ON public.follows
  FOR DELETE USING (auth.uid()::text = follower_id);

-- Stories table policies
CREATE POLICY "Stories are viewable by everyone" ON public.stories
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own stories" ON public.stories
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own stories" ON public.stories
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own stories" ON public.stories
  FOR DELETE USING (auth.uid()::text = user_id);

-- Surveys table policies
CREATE POLICY "Surveys are viewable by everyone" ON public.surveys
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create surveys" ON public.surveys
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own surveys" ON public.surveys
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own surveys" ON public.surveys
  FOR DELETE USING (auth.uid()::text = user_id);

-- Survey responses table policies
CREATE POLICY "Users can view their own survey responses" ON public.survey_responses
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create survey responses" ON public.survey_responses
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own survey responses" ON public.survey_responses
  FOR UPDATE USING (auth.uid()::text = user_id);

-- Sponsors table policies
CREATE POLICY "Sponsors are viewable by everyone" ON public.sponsors
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage sponsors" ON public.sponsors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND username = 'admin'
    )
  );

-- Post likes table policies
CREATE POLICY "Post likes are viewable by everyone" ON public.post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create post likes" ON public.post_likes
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own post likes" ON public.post_likes
  FOR DELETE USING (auth.uid()::text = user_id);

-- Story likes table policies
CREATE POLICY "Story likes are viewable by everyone" ON public.story_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can create story likes" ON public.story_likes
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own story likes" ON public.story_likes
  FOR DELETE USING (auth.uid()::text = user_id);

-- Story comments table policies
CREATE POLICY "Story comments are viewable by everyone" ON public.story_comments
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create story comments" ON public.story_comments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own story comments" ON public.story_comments
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own story comments" ON public.story_comments
  FOR DELETE USING (auth.uid()::text = user_id);
