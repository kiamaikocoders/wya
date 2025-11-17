-- Add performing_artists and time fields to events table
-- This migration adds support for event times and performing artists

-- Add performing_artists column (array of text)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS performing_artists TEXT[] DEFAULT '{}';

-- Add time column (TIME type for event start time)
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS time TIME;

-- Add index for performing_artists (GIN index for array searches)
CREATE INDEX IF NOT EXISTS idx_events_performing_artists 
ON public.events USING GIN(performing_artists);

-- Add index for time
CREATE INDEX IF NOT EXISTS idx_events_time 
ON public.events(time);

-- Add comment for documentation
COMMENT ON COLUMN public.events.performing_artists IS 'Array of performing artist names for the event';
COMMENT ON COLUMN public.events.time IS 'Event start time (optional, some events may only have dates)';

