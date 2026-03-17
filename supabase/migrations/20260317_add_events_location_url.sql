-- Add optional maps URL to events
-- Allows admins to paste any maps link (Google, Apple, Mapbox, etc.) as a fallback

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS location_url TEXT;

