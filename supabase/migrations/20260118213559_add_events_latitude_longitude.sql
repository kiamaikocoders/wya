-- Add latitude/longitude to events to match app expectations
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);

