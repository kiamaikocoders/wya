-- Offline Mode Support and Caching System
-- This migration adds comprehensive offline functionality and caching

-- ==============================================
-- OFFLINE MODE TABLES
-- ==============================================

-- Offline data cache
CREATE TABLE IF NOT EXISTS public.offline_cache (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL,
  cache_type TEXT NOT NULL, -- events, profiles, messages, etc.
  data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced', -- synced, pending, failed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, cache_key)
);

-- Offline actions queue (for when user comes back online)
CREATE TABLE IF NOT EXISTS public.offline_actions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- create, update, delete
  table_name TEXT NOT NULL,
  record_id TEXT,
  data JSONB NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Sync status tracking
CREATE TABLE IF NOT EXISTS public.sync_status (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  last_sync_timestamp TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'synced', -- synced, pending, failed
  record_count INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, table_name)
);

-- Performance metrics
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  metric_type TEXT NOT NULL, -- api_response_time, cache_hit_rate, etc.
  metric_value DECIMAL(10,4) NOT NULL,
  metadata JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- RLS POLICIES FOR OFFLINE TABLES
-- ==============================================

-- Offline cache RLS
ALTER TABLE public.offline_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own cache" ON public.offline_cache
  FOR ALL USING (auth.uid() = user_id);

-- Offline actions RLS
ALTER TABLE public.offline_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own offline actions" ON public.offline_actions
  FOR ALL USING (auth.uid() = user_id);

-- Sync status RLS
ALTER TABLE public.sync_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sync status" ON public.sync_status
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can manage sync status" ON public.sync_status
  FOR ALL USING (true);

-- Performance metrics RLS
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own metrics" ON public.performance_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can record metrics" ON public.performance_metrics
  FOR INSERT WITH CHECK (true);

-- ==============================================
-- OFFLINE MODE FUNCTIONS
-- ==============================================

-- Function to cache data for offline use
CREATE OR REPLACE FUNCTION public.cache_data_for_offline(
  p_cache_key TEXT,
  p_cache_type TEXT,
  p_data JSONB,
  p_expires_in_hours INTEGER DEFAULT 24
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cache_id INTEGER;
  result JSON;
BEGIN
  -- Insert or update cache
  INSERT INTO public.offline_cache (
    user_id, cache_key, cache_type, data, expires_at
  ) VALUES (
    auth.uid(), p_cache_key, p_cache_type, p_data, 
    NOW() + (p_expires_in_hours || ' hours')::INTERVAL
  )
  ON CONFLICT (user_id, cache_key) 
  DO UPDATE SET 
    data = EXCLUDED.data,
    expires_at = EXCLUDED.expires_at,
    last_synced_at = NOW(),
    updated_at = NOW()
  RETURNING id INTO cache_id;

  -- Return success response
  SELECT json_build_object(
    'success', TRUE,
    'cache_id', cache_id,
    'cache_key', p_cache_key,
    'expires_at', NOW() + (p_expires_in_hours || ' hours')::INTERVAL
  ) INTO result;

  RETURN result;
END;
$$;

-- Function to get cached data
CREATE OR REPLACE FUNCTION public.get_cached_data(
  p_cache_key TEXT,
  p_cache_type TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cached_data JSON;
BEGIN
  -- Get cached data
  SELECT json_build_object(
    'data', oc.data,
    'expires_at', oc.expires_at,
    'last_synced_at', oc.last_synced_at,
    'sync_status', oc.sync_status
  ) INTO cached_data
  FROM public.offline_cache oc
  WHERE oc.user_id = auth.uid() 
  AND oc.cache_key = p_cache_key
  AND (p_cache_type IS NULL OR oc.cache_type = p_cache_type)
  AND (oc.expires_at IS NULL OR oc.expires_at > NOW());

  RETURN COALESCE(cached_data, json_build_object('data', null));
END;
$$;

-- Function to queue offline action
CREATE OR REPLACE FUNCTION public.queue_offline_action(
  p_action_type TEXT,
  p_table_name TEXT,
  p_record_id TEXT,
  p_data JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  action_id INTEGER;
  result JSON;
BEGIN
  -- Queue the action
  INSERT INTO public.offline_actions (
    user_id, action_type, table_name, record_id, data
  ) VALUES (
    auth.uid(), p_action_type, p_table_name, p_record_id, p_data
  ) RETURNING id INTO action_id;

  -- Return success response
  SELECT json_build_object(
    'success', TRUE,
    'action_id', action_id,
    'status', 'pending',
    'queued_at', NOW()
  ) INTO result;

  RETURN result;
END;
$$;

-- Function to process offline actions
CREATE OR REPLACE FUNCTION public.process_offline_actions()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  action_record RECORD;
  processed_count INTEGER := 0;
  failed_count INTEGER := 0;
  result JSON;
BEGIN
  -- Process pending actions
  FOR action_record IN 
    SELECT * FROM public.offline_actions 
    WHERE status = 'pending' 
    AND retry_count < max_retries
    ORDER BY created_at ASC
  LOOP
    BEGIN
      -- Update status to processing
      UPDATE public.offline_actions 
      SET status = 'processing'
      WHERE id = action_record.id;

      -- Process based on action type
      CASE action_record.action_type
        WHEN 'create' THEN
          -- Execute insert based on table name
          EXECUTE format('INSERT INTO public.%I (%s) VALUES (%s)',
            action_record.table_name,
            (SELECT string_agg(key, ',') FROM jsonb_each(action_record.data)),
            (SELECT string_agg(quote_literal(value::text), ',') FROM jsonb_each(action_record.data))
          );

        WHEN 'update' THEN
          -- Execute update based on table name
          EXECUTE format('UPDATE public.%I SET %s WHERE id = %s',
            action_record.table_name,
            (SELECT string_agg(key || ' = ' || quote_literal(value::text), ',') FROM jsonb_each(action_record.data)),
            quote_literal(action_record.record_id)
          );

        WHEN 'delete' THEN
          -- Execute delete based on table name
          EXECUTE format('DELETE FROM public.%I WHERE id = %s',
            action_record.table_name,
            quote_literal(action_record.record_id)
          );
      END CASE;

      -- Mark as completed
      UPDATE public.offline_actions 
      SET 
        status = 'completed',
        processed_at = NOW()
      WHERE id = action_record.id;

      processed_count := processed_count + 1;

    EXCEPTION WHEN OTHERS THEN
      -- Mark as failed and increment retry count
      UPDATE public.offline_actions 
      SET 
        status = 'failed',
        retry_count = retry_count + 1,
        error_message = SQLERRM
      WHERE id = action_record.id;

      failed_count := failed_count + 1;
    END;
  END LOOP;

  -- Return processing summary
  SELECT json_build_object(
    'success', TRUE,
    'processed_count', processed_count,
    'failed_count', failed_count,
    'processed_at', NOW()
  ) INTO result;

  RETURN result;
END;
$$;

-- Function to get sync status
CREATE OR REPLACE FUNCTION public.get_sync_status()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sync_data JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'table_name', ss.table_name,
      'last_sync_timestamp', ss.last_sync_timestamp,
      'sync_status', ss.sync_status,
      'record_count', ss.record_count,
      'last_updated', ss.last_updated
    )
  ) INTO sync_data
  FROM public.sync_status ss
  WHERE ss.user_id = auth.uid();

  RETURN COALESCE(sync_data, '[]'::json);
END;
$$;

-- Function to update sync status
CREATE OR REPLACE FUNCTION public.update_sync_status(
  p_table_name TEXT,
  p_sync_status TEXT,
  p_record_count INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Update or insert sync status
  INSERT INTO public.sync_status (
    user_id, table_name, last_sync_timestamp, sync_status, record_count
  ) VALUES (
    auth.uid(), p_table_name, NOW(), p_sync_status, COALESCE(p_record_count, 0)
  )
  ON CONFLICT (user_id, table_name) 
  DO UPDATE SET 
    last_sync_timestamp = NOW(),
    sync_status = EXCLUDED.sync_status,
    record_count = COALESCE(EXCLUDED.record_count, sync_status.record_count),
    last_updated = NOW();

  -- Return success response
  SELECT json_build_object(
    'success', TRUE,
    'table_name', p_table_name,
    'sync_status', p_sync_status,
    'updated_at', NOW()
  ) INTO result;

  RETURN result;
END;
$$;

-- Function to record performance metrics
CREATE OR REPLACE FUNCTION public.record_performance_metric(
  p_metric_type TEXT,
  p_metric_value DECIMAL(10,4),
  p_metadata JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.performance_metrics (
    user_id, metric_type, metric_value, metadata
  ) VALUES (
    auth.uid(), p_metric_type, p_metric_value, p_metadata
  );
END;
$$;

-- Function to get performance metrics
CREATE OR REPLACE FUNCTION public.get_performance_metrics(
  p_metric_type TEXT DEFAULT NULL,
  p_hours_back INTEGER DEFAULT 24
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  metrics JSON;
BEGIN
  SELECT json_agg(
    json_build_object(
      'metric_type', pm.metric_type,
      'metric_value', pm.metric_value,
      'metadata', pm.metadata,
      'recorded_at', pm.recorded_at
    )
  ) INTO metrics
  FROM public.performance_metrics pm
  WHERE pm.user_id = auth.uid()
  AND (p_metric_type IS NULL OR pm.metric_type = p_metric_type)
  AND pm.recorded_at > NOW() - (p_hours_back || ' hours')::INTERVAL
  ORDER BY pm.recorded_at DESC;

  RETURN COALESCE(metrics, '[]'::json);
END;
$$;

-- Function to clean up expired cache
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
  result JSON;
BEGIN
  -- Delete expired cache entries
  DELETE FROM public.offline_cache 
  WHERE expires_at IS NOT NULL 
  AND expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  -- Return cleanup summary
  SELECT json_build_object(
    'success', TRUE,
    'deleted_count', deleted_count,
    'cleaned_at', NOW()
  ) INTO result;

  RETURN result;
END;
$$;

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Offline cache indexes
CREATE INDEX IF NOT EXISTS idx_offline_cache_user_id ON public.offline_cache(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_cache_cache_key ON public.offline_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_offline_cache_cache_type ON public.offline_cache(cache_type);
CREATE INDEX IF NOT EXISTS idx_offline_cache_expires_at ON public.offline_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_offline_cache_sync_status ON public.offline_cache(sync_status);

-- Offline actions indexes
CREATE INDEX IF NOT EXISTS idx_offline_actions_user_id ON public.offline_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_actions_status ON public.offline_actions(status);
CREATE INDEX IF NOT EXISTS idx_offline_actions_action_type ON public.offline_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_offline_actions_table_name ON public.offline_actions(table_name);
CREATE INDEX IF NOT EXISTS idx_offline_actions_created_at ON public.offline_actions(created_at);

-- Sync status indexes
CREATE INDEX IF NOT EXISTS idx_sync_status_user_id ON public.sync_status(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_status_table_name ON public.sync_status(table_name);
CREATE INDEX IF NOT EXISTS idx_sync_status_sync_status ON public.sync_status(sync_status);

-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_user_id ON public.performance_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_metric_type ON public.performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_recorded_at ON public.performance_metrics(recorded_at);
