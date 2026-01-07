-- Fix Notification RLS Policies
-- This migration fixes the notifications table RLS policies to allow system-level notification creation

-- ==============================================
-- DROP EXISTING NOTIFICATION POLICIES
-- ==============================================

-- Drop all existing policies on notifications table if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

-- ==============================================
-- CREATE NEW NOTIFICATION POLICIES
-- ==============================================

-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated users to create notifications for any user
-- This is needed for system notifications and admin notifications
CREATE POLICY "Authenticated users can create notifications" 
  ON public.notifications
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own notifications (e.g., mark as read)
CREATE POLICY "Users can update their own notifications" 
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications" 
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- ==============================================
-- ENSURE RLS IS ENABLED
-- ==============================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

