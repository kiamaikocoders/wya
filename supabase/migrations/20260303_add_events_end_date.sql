-- Add end_date to events for multi-day events (from ... to)
-- When null, event is single-day (date only). When set, event runs through end_date (inclusive).
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS end_date DATE;

COMMENT ON COLUMN public.events.end_date IS 'Last day of the event (inclusive). Null for single-day events.';

CREATE INDEX IF NOT EXISTS idx_events_end_date ON public.events(end_date);
