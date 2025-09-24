-- Performance Optimizations and Database Indexing Strategy
-- This migration adds comprehensive performance improvements

-- ==============================================
-- COMPREHENSIVE INDEXING STRATEGY
-- ==============================================

-- Events table indexes
CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(date);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);
CREATE INDEX IF NOT EXISTS idx_events_featured ON public.events(featured);
CREATE INDEX IF NOT EXISTS idx_events_location ON public.events(location);
CREATE INDEX IF NOT EXISTS idx_events_price ON public.events(price);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at);
CREATE INDEX IF NOT EXISTS idx_events_updated_at ON public.events(updated_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_organizer_date ON public.events(organizer_id, date);
CREATE INDEX IF NOT EXISTS idx_events_category_featured ON public.events(category, featured);
CREATE INDEX IF NOT EXISTS idx_events_date_featured ON public.events(date, featured);

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles(full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- Tickets table indexes
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON public.tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_type ON public.tickets(ticket_type);
CREATE INDEX IF NOT EXISTS idx_tickets_purchase_date ON public.tickets(purchase_date);
CREATE INDEX IF NOT EXISTS idx_tickets_event_date ON public.tickets(event_date);

-- Composite indexes for tickets
CREATE INDEX IF NOT EXISTS idx_tickets_user_status ON public.tickets(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_event_status ON public.tickets(event_id, status);

-- Payments table indexes
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_event_id ON public.payments(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON public.payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_reference_code ON public.payments(reference_code);

-- Composite indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON public.payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_event_status ON public.payments(event_id, status);

-- Messages table indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- Composite indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_read ON public.messages(receiver_id, is_read);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Composite indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON public.notifications(user_id, type);

-- Forum posts table indexes
CREATE INDEX IF NOT EXISTS idx_forum_posts_user_id ON public.forum_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_event_id ON public.forum_posts(event_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_likes_count ON public.forum_posts(likes_count);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created_at ON public.forum_posts(created_at);

-- Composite indexes for forum posts
CREATE INDEX IF NOT EXISTS idx_forum_posts_event_created ON public.forum_posts(event_id, created_at);
CREATE INDEX IF NOT EXISTS idx_forum_posts_user_created ON public.forum_posts(user_id, created_at);

-- Forum comments table indexes
CREATE INDEX IF NOT EXISTS idx_forum_comments_user_id ON public.forum_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_post_id ON public.forum_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_created_at ON public.forum_comments(created_at);

-- Stories table indexes
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_event_id ON public.stories(event_id);
CREATE INDEX IF NOT EXISTS idx_stories_media_type ON public.stories(media_type);
CREATE INDEX IF NOT EXISTS idx_stories_status ON public.stories(status);
CREATE INDEX IF NOT EXISTS idx_stories_is_featured ON public.stories(is_featured);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);

-- Composite indexes for stories
CREATE INDEX IF NOT EXISTS idx_stories_user_created ON public.stories(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_stories_event_created ON public.stories(event_id, created_at);
CREATE INDEX IF NOT EXISTS idx_stories_featured_created ON public.stories(is_featured, created_at);

-- Story likes table indexes
CREATE INDEX IF NOT EXISTS idx_story_likes_user_id ON public.story_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_story_id ON public.story_likes(story_id);
CREATE INDEX IF NOT EXISTS idx_story_likes_created_at ON public.story_likes(created_at);

-- Story comments table indexes
CREATE INDEX IF NOT EXISTS idx_story_comments_user_id ON public.story_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_story_id ON public.story_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_story_comments_created_at ON public.story_comments(created_at);

-- Favorites table indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_event_id ON public.favorites(event_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created_at ON public.favorites(created_at);

-- Follows table indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_created_at ON public.follows(created_at);

-- Post likes table indexes
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_created_at ON public.post_likes(created_at);

-- Surveys table indexes
CREATE INDEX IF NOT EXISTS idx_surveys_user_id ON public.surveys(user_id);
CREATE INDEX IF NOT EXISTS idx_surveys_event_id ON public.surveys(event_id);
CREATE INDEX IF NOT EXISTS idx_surveys_status ON public.surveys(status);
CREATE INDEX IF NOT EXISTS idx_surveys_created_at ON public.surveys(created_at);

-- Survey questions table indexes
CREATE INDEX IF NOT EXISTS idx_survey_questions_survey_id ON public.survey_questions(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_questions_order_position ON public.survey_questions(order_position);
CREATE INDEX IF NOT EXISTS idx_survey_questions_question_type ON public.survey_questions(question_type);

-- Survey responses table indexes
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON public.survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON public.survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at ON public.survey_responses(created_at);

-- Sponsors table indexes
CREATE INDEX IF NOT EXISTS idx_sponsors_partnership_level ON public.sponsors(partnership_level);
CREATE INDEX IF NOT EXISTS idx_sponsors_created_at ON public.sponsors(created_at);

-- Event sponsors table indexes
CREATE INDEX IF NOT EXISTS idx_event_sponsors_event_id ON public.event_sponsors(event_id);
CREATE INDEX IF NOT EXISTS idx_event_sponsors_sponsor_id ON public.event_sponsors(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_event_sponsors_sponsorship_type ON public.event_sponsors(sponsorship_type);

-- Proposals table indexes
CREATE INDEX IF NOT EXISTS idx_proposals_submitted_by ON public.proposals(submitted_by);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_category ON public.proposals(category);
CREATE INDEX IF NOT EXISTS idx_proposals_submitted_on ON public.proposals(submitted_on);

-- ==============================================
-- PERFORMANCE OPTIMIZATION FUNCTIONS
-- ==============================================

-- Function to analyze query performance
CREATE OR REPLACE FUNCTION public.analyze_query_performance()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  analysis JSON;
BEGIN
  -- Only admins can run performance analysis
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND username = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can run performance analysis';
  END IF;

  -- Get table statistics
  SELECT json_build_object(
    'tables', (
      SELECT json_agg(
        json_build_object(
          'table_name', schemaname||'.'||tablename,
          'row_count', n_tup_ins - n_tup_del,
          'size_mb', ROUND(pg_total_relation_size(schemaname||'.'||tablename) / 1024 / 1024, 2)
        )
      )
      FROM pg_stat_user_tables
      WHERE schemaname = 'public'
    ),
    'indexes', (
      SELECT json_agg(
        json_build_object(
          'index_name', indexname,
          'table_name', tablename,
          'size_mb', ROUND(pg_relation_size(indexname) / 1024 / 1024, 2)
        )
      )
      FROM pg_indexes
      WHERE schemaname = 'public'
    ),
    'analyzed_at', NOW()
  ) INTO analysis;

  RETURN analysis;
END;
$$;

-- Function to get slow queries
CREATE OR REPLACE FUNCTION public.get_slow_queries()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  slow_queries JSON;
BEGIN
  -- Only admins can view slow queries
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND username = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can view slow queries';
  END IF;

  -- Get slow query statistics
  SELECT json_agg(
    json_build_object(
      'query', query,
      'calls', calls,
      'total_time', ROUND(total_time::numeric, 2),
      'mean_time', ROUND(mean_time::numeric, 2),
      'max_time', ROUND(max_time::numeric, 2)
    )
  ) INTO slow_queries
  FROM pg_stat_statements
  WHERE mean_time > 1000 -- Queries taking more than 1 second on average
  ORDER BY mean_time DESC
  LIMIT 20;

  RETURN COALESCE(slow_queries, '[]'::json);
END;
$$;

-- Function to optimize database
CREATE OR REPLACE FUNCTION public.optimize_database()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Only admins can optimize database
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND username = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can optimize database';
  END IF;

  -- Update table statistics
  ANALYZE;

  -- Vacuum tables
  VACUUM ANALYZE;

  -- Return optimization summary
  SELECT json_build_object(
    'success', TRUE,
    'optimized_at', NOW(),
    'actions', json_build_array(
      'Updated table statistics',
      'Vacuumed and analyzed tables',
      'Optimized query plans'
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Function to get database health metrics
CREATE OR REPLACE FUNCTION public.get_database_health()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  health_metrics JSON;
BEGIN
  -- Only admins can view database health
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND username = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can view database health';
  END IF;

  -- Get database health metrics
  SELECT json_build_object(
    'database_size_mb', ROUND(pg_database_size(current_database()) / 1024 / 1024, 2),
    'active_connections', (
      SELECT count(*) FROM pg_stat_activity WHERE state = 'active'
    ),
    'total_connections', (
      SELECT count(*) FROM pg_stat_activity
    ),
    'cache_hit_ratio', (
      SELECT ROUND(
        (sum(blks_hit)::float / (sum(blks_hit) + sum(blks_read))) * 100, 2
      )
      FROM pg_stat_database
      WHERE datname = current_database()
    ),
    'slow_queries_count', (
      SELECT count(*) FROM pg_stat_statements WHERE mean_time > 1000
    ),
    'index_usage', (
      SELECT json_agg(
        json_build_object(
          'index_name', indexrelname,
          'table_name', relname,
          'idx_scan', idx_scan,
          'idx_tup_read', idx_tup_read,
          'idx_tup_fetch', idx_tup_fetch
        )
      )
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC
      LIMIT 10
    ),
    'checked_at', NOW()
  ) INTO health_metrics;

  RETURN health_metrics;
END;
$$;

-- ==============================================
-- CONNECTION POOLING CONFIGURATION
-- ==============================================

-- Function to get connection pool status
CREATE OR REPLACE FUNCTION public.get_connection_pool_status()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  pool_status JSON;
BEGIN
  -- Only admins can view connection pool status
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND username = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can view connection pool status';
  END IF;

  -- Get connection pool metrics
  SELECT json_build_object(
    'total_connections', (
      SELECT count(*) FROM pg_stat_activity
    ),
    'active_connections', (
      SELECT count(*) FROM pg_stat_activity WHERE state = 'active'
    ),
    'idle_connections', (
      SELECT count(*) FROM pg_stat_activity WHERE state = 'idle'
    ),
    'long_running_queries', (
      SELECT count(*) FROM pg_stat_activity 
      WHERE state = 'active' AND now() - query_start > interval '5 minutes'
    ),
    'database_locks', (
      SELECT count(*) FROM pg_locks
    ),
    'checked_at', NOW()
  ) INTO pool_status;

  RETURN pool_status;
END;
$$;

-- ==============================================
-- RATE LIMITING FUNCTIONS
-- ==============================================

-- Function to check rate limit
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_action TEXT,
  p_limit_count INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_count INTEGER;
BEGIN
  -- Count requests in the time window
  SELECT COUNT(*) INTO request_count
  FROM public.performance_metrics
  WHERE user_id = auth.uid()
  AND metric_type = 'rate_limit_' || p_action
  AND recorded_at > NOW() - (p_window_minutes || ' minutes')::INTERVAL;

  -- Check if limit exceeded
  IF request_count >= p_limit_count THEN
    RETURN FALSE;
  END IF;

  -- Record this request
  INSERT INTO public.performance_metrics (
    user_id, metric_type, metric_value, metadata
  ) VALUES (
    auth.uid(), 'rate_limit_' || p_action, 1, 
    json_build_object('action', p_action, 'timestamp', NOW())
  );

  RETURN TRUE;
END;
$$;

-- Function to get rate limit status
CREATE OR REPLACE FUNCTION public.get_rate_limit_status(p_action TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  status JSON;
  request_count INTEGER;
  window_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get request count in last hour
  SELECT COUNT(*), MIN(recorded_at) INTO request_count, window_start
  FROM public.performance_metrics
  WHERE user_id = auth.uid()
  AND metric_type = 'rate_limit_' || p_action
  AND recorded_at > NOW() - INTERVAL '1 hour';

  -- Build status response
  SELECT json_build_object(
    'action', p_action,
    'request_count', COALESCE(request_count, 0),
    'window_start', COALESCE(window_start, NOW() - INTERVAL '1 hour'),
    'window_end', NOW(),
    'limit_remaining', GREATEST(100 - COALESCE(request_count, 0), 0),
    'is_limited', COALESCE(request_count, 0) >= 100
  ) INTO status;

  RETURN status;
END;
$$;

-- ==============================================
-- MAINTENANCE FUNCTIONS
-- ==============================================

-- Function to clean up old data
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cleanup_result JSON;
  deleted_count INTEGER := 0;
BEGIN
  -- Only admins can run cleanup
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND username = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can run cleanup';
  END IF;

  -- Clean up old performance metrics (older than 30 days)
  DELETE FROM public.performance_metrics 
  WHERE recorded_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Clean up old audit logs (older than 90 days)
  DELETE FROM public.audit_logs 
  WHERE created_at < NOW() - INTERVAL '90 days';

  -- Return cleanup summary
  SELECT json_build_object(
    'success', TRUE,
    'performance_metrics_deleted', deleted_count,
    'cleanup_completed_at', NOW()
  ) INTO cleanup_result;

  RETURN cleanup_result;
END;
$$;
