-- Fix Ghost Action Deletion
-- This migration updates the foreign key constraint to allow CASCADE deletion
-- so admins can delete actions even when they have logs

-- Drop the existing foreign key constraint
ALTER TABLE public.ghost_action_log 
  DROP CONSTRAINT IF EXISTS ghost_action_log_queue_id_fkey;

-- Recreate it with ON DELETE CASCADE
ALTER TABLE public.ghost_action_log 
  ADD CONSTRAINT ghost_action_log_queue_id_fkey 
  FOREIGN KEY (queue_id) 
  REFERENCES public.ghost_action_queue(id) 
  ON DELETE CASCADE;
