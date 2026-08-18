-- Add end_time to events for event end time (start is in time column)
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS end_time TIME;

COMMENT ON COLUMN public.events.end_time IS 'Event end time (optional). Start time is in time column.';

CREATE INDEX IF NOT EXISTS idx_events_end_time ON public.events(end_time);
