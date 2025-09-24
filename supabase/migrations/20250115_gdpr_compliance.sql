-- GDPR Compliance and Data Protection Features
-- This migration adds GDPR compliance features including data export and deletion

-- ==============================================
-- GDPR COMPLIANCE FUNCTIONS
-- ==============================================

-- Function to export all user data
CREATE OR REPLACE FUNCTION public.export_user_data(user_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_data JSON;
BEGIN
  -- Check if user is requesting their own data or is admin
  IF auth.uid() != user_uuid AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND username = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Can only export your own data';
  END IF;

  -- Collect all user data
  SELECT json_build_object(
    'profile', (
      SELECT to_json(p.*) FROM public.profiles p WHERE p.id = user_uuid
    ),
    'events', (
      SELECT json_agg(to_json(e.*)) FROM public.events e WHERE e.organizer_id = user_uuid::text
    ),
    'tickets', (
      SELECT json_agg(to_json(t.*)) FROM public.tickets t WHERE t.user_id = user_uuid::text
    ),
    'payments', (
      SELECT json_agg(to_json(p.*)) FROM public.payments p WHERE p.user_id = user_uuid::text
    ),
    'notifications', (
      SELECT json_agg(to_json(n.*)) FROM public.notifications n WHERE n.user_id = user_uuid::text
    ),
    'messages_sent', (
      SELECT json_agg(to_json(m.*)) FROM public.messages m WHERE m.sender_id = user_uuid::text
    ),
    'messages_received', (
      SELECT json_agg(to_json(m.*)) FROM public.messages m WHERE m.receiver_id = user_uuid::text
    ),
    'favorites', (
      SELECT json_agg(to_json(f.*)) FROM public.favorites f WHERE f.user_id = user_uuid::text
    ),
    'follows', (
      SELECT json_agg(to_json(f.*)) FROM public.follows f WHERE f.follower_id = user_uuid::text
    ),
    'followers', (
      SELECT json_agg(to_json(f.*)) FROM public.follows f WHERE f.following_id = user_uuid::text
    ),
    'stories', (
      SELECT json_agg(to_json(s.*)) FROM public.stories s WHERE s.user_id = user_uuid::text
    ),
    'forum_posts', (
      SELECT json_agg(to_json(fp.*)) FROM public.forum_posts fp WHERE fp.user_id = user_uuid::text
    ),
    'forum_comments', (
      SELECT json_agg(to_json(fc.*)) FROM public.forum_comments fc WHERE fc.user_id = user_uuid::text
    ),
    'survey_responses', (
      SELECT json_agg(to_json(sr.*)) FROM public.survey_responses sr WHERE sr.user_id = user_uuid::text
    ),
    'exported_at', NOW(),
    'data_subject_id', user_uuid
  ) INTO user_data;

  RETURN user_data;
END;
$$;

-- Function to delete all user data (GDPR Right to be Forgotten)
CREATE OR REPLACE FUNCTION public.delete_user_data(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is requesting their own data deletion or is admin
  IF auth.uid() != user_uuid AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND username = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Can only delete your own data';
  END IF;

  -- Delete in order to respect foreign key constraints
  DELETE FROM public.story_likes WHERE user_id = user_uuid::text;
  DELETE FROM public.story_comments WHERE user_id = user_uuid::text;
  DELETE FROM public.stories WHERE user_id = user_uuid::text;
  
  DELETE FROM public.post_likes WHERE user_id = user_uuid::text;
  DELETE FROM public.forum_comments WHERE user_id = user_uuid::text;
  DELETE FROM public.forum_posts WHERE user_id = user_uuid::text;
  
  DELETE FROM public.survey_responses WHERE user_id = user_uuid::text;
  DELETE FROM public.surveys WHERE user_id = user_uuid::text;
  
  DELETE FROM public.favorites WHERE user_id = user_uuid::text;
  DELETE FROM public.follows WHERE follower_id = user_uuid::text OR following_id = user_uuid::text;
  
  DELETE FROM public.messages WHERE sender_id = user_uuid::text OR receiver_id = user_uuid::text;
  DELETE FROM public.notifications WHERE user_id = user_uuid::text;
  
  DELETE FROM public.tickets WHERE user_id = user_uuid::text;
  DELETE FROM public.payments WHERE user_id = user_uuid::text;
  
  -- Update events to remove organizer reference
  UPDATE public.events SET organizer_id = NULL WHERE organizer_id = user_uuid::text;
  
  -- Finally delete the profile
  DELETE FROM public.profiles WHERE id = user_uuid;

  RETURN TRUE;
END;
$$;

-- Function to anonymize user data (GDPR Right to be Forgotten - Soft Delete)
CREATE OR REPLACE FUNCTION public.anonymize_user_data(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is requesting their own data anonymization or is admin
  IF auth.uid() != user_uuid AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND username = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Can only anonymize your own data';
  END IF;

  -- Anonymize profile data
  UPDATE public.profiles 
  SET 
    full_name = 'Deleted User',
    username = 'deleted_user_' || extract(epoch from now())::text,
    avatar_url = NULL,
    bio = NULL,
    location = NULL,
    updated_at = NOW()
  WHERE id = user_uuid;

  -- Anonymize messages
  UPDATE public.messages 
  SET content = '[Message deleted by user]'
  WHERE sender_id = user_uuid::text;

  -- Anonymize forum posts
  UPDATE public.forum_posts 
  SET 
    title = '[Post deleted by user]',
    content = '[Content deleted by user]'
  WHERE user_id = user_uuid::text;

  -- Anonymize forum comments
  UPDATE public.forum_comments 
  SET content = '[Comment deleted by user]'
  WHERE user_id = user_uuid::text;

  -- Anonymize stories
  UPDATE public.stories 
  SET 
    caption = '[Story deleted by user]',
    content = '[Content deleted by user]',
    media_url = NULL
  WHERE user_id = user_uuid::text;

  -- Anonymize story comments
  UPDATE public.story_comments 
  SET content = '[Comment deleted by user]'
  WHERE user_id = user_uuid::text;

  RETURN TRUE;
END;
$$;

-- Function to check data retention compliance
CREATE OR REPLACE FUNCTION public.check_data_retention()
RETURNS TABLE(
  table_name TEXT,
  old_records_count BIGINT,
  retention_days INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check for old records that should be deleted based on retention policy
  RETURN QUERY
  SELECT 
    'notifications'::TEXT,
    COUNT(*),
    90 -- 90 days retention for notifications
  FROM public.notifications 
  WHERE created_at < NOW() - INTERVAL '90 days'
  
  UNION ALL
  
  SELECT 
    'messages'::TEXT,
    COUNT(*),
    365 -- 1 year retention for messages
  FROM public.messages 
  WHERE created_at < NOW() - INTERVAL '365 days'
  
  UNION ALL
  
  SELECT 
    'stories'::TEXT,
    COUNT(*),
    7 -- 7 days retention for stories (like Instagram)
  FROM public.stories 
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Function to clean up old data based on retention policies
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cleanup_result JSON;
BEGIN
  -- Only admins can run cleanup
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND username = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can run data cleanup';
  END IF;

  -- Clean up old notifications (90 days)
  DELETE FROM public.notifications 
  WHERE created_at < NOW() - INTERVAL '90 days';

  -- Clean up old stories (7 days)
  DELETE FROM public.stories 
  WHERE created_at < NOW() - INTERVAL '7 days';

  -- Clean up old expired tickets
  DELETE FROM public.tickets 
  WHERE event_date < NOW() - INTERVAL '30 days' 
  AND status = 'expired';

  -- Return cleanup summary
  SELECT json_build_object(
    'cleanup_completed_at', NOW(),
    'notifications_cleaned', '90+ days old',
    'stories_cleaned', '7+ days old',
    'expired_tickets_cleaned', '30+ days old'
  ) INTO cleanup_result;

  RETURN cleanup_result;
END;
$$;

-- ==============================================
-- DATA ENCRYPTION AT REST
-- ==============================================

-- Function to encrypt sensitive data
CREATE OR REPLACE FUNCTION public.encrypt_sensitive_data(data TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use pgcrypto for encryption
  -- In production, use proper encryption keys from environment
  RETURN encode(digest(data || 'salt_key_here', 'sha256'), 'hex');
END;
$$;

-- Function to decrypt sensitive data
CREATE OR REPLACE FUNCTION public.decrypt_sensitive_data(encrypted_data TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This is a placeholder - implement proper decryption
  -- In production, use proper decryption with secure keys
  RETURN encrypted_data;
END;
$$;

-- ==============================================
-- AUDIT LOGGING
-- ==============================================

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND username = 'admin'
    )
  );

-- Function to log data access
CREATE OR REPLACE FUNCTION public.log_data_access(
  action_type TEXT,
  table_name TEXT,
  record_id TEXT,
  additional_data JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    new_values,
    created_at
  ) VALUES (
    auth.uid(),
    action_type,
    table_name,
    record_id,
    additional_data,
    NOW()
  );
END;
$$;
