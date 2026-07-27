-- Reset Stuck Processing Actions
-- This migration creates a function to reset actions stuck in "processing" state
-- (usually due to Edge Function timeouts)

CREATE OR REPLACE FUNCTION public.reset_stuck_processing_actions()
RETURNS TABLE(
  reset_count INTEGER,
  action_ids INTEGER[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stuck_actions INTEGER[];
  reset_count INTEGER;
BEGIN
  -- Find actions stuck in processing for more than 10 minutes
  SELECT ARRAY_AGG(id) INTO stuck_actions
  FROM public.ghost_action_queue
  WHERE status = 'processing'
    AND updated_at < NOW() - INTERVAL '10 minutes';
  
  -- Reset them back to pending
  UPDATE public.ghost_action_queue
  SET 
    status = 'pending',
    updated_at = NOW()
  WHERE status = 'processing'
    AND updated_at < NOW() - INTERVAL '10 minutes';
  
  GET DIAGNOSTICS reset_count = ROW_COUNT;
  
  RETURN QUERY SELECT reset_count, COALESCE(stuck_actions, ARRAY[]::INTEGER[]);
END;
$$;
