-- Change target_id to TEXT to support both integers (event_id) and UUIDs (user_id)
-- This allows follow_user actions to store UUID strings

-- Change target_id column type in ghost_action_queue
ALTER TABLE public.ghost_action_queue 
  ALTER COLUMN target_id TYPE TEXT USING target_id::TEXT;

-- Update the log_ghost_action function to accept TEXT for target_id
CREATE OR REPLACE FUNCTION public.log_ghost_action(
  p_queue_id INTEGER,
  p_ghost_user_id UUID,
  p_action_type TEXT,
  p_target_id TEXT,  -- Changed from INTEGER to TEXT
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
    error_message,
    executed_at
  ) VALUES (
    p_queue_id,
    p_ghost_user_id,
    p_action_type,
    p_target_id,
    p_target_type,
    p_success,
    p_error_message,
    NOW()
  );
END;
$$;

-- Also update target_id in ghost_action_log table to TEXT
ALTER TABLE public.ghost_action_log 
  ALTER COLUMN target_id TYPE TEXT USING target_id::TEXT;
