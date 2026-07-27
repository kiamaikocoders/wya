-- Add status column to events table for admin management
-- This allows events to have pending/approved/rejected status

-- Add status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.events 
    ADD COLUMN status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected'));
    
    -- Set all existing events to approved
    UPDATE public.events SET status = 'approved' WHERE status IS NULL;
    
    -- Create index for faster filtering
    CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
  END IF;
END $$;

-- Update RLS policies to allow admins to manage event status
-- The existing admin policy should already cover this, but let's ensure it's explicit

-- Add comment for documentation
COMMENT ON COLUMN public.events.status IS 'Event approval status: pending (awaiting admin review), approved (visible to users), rejected (not visible)';

