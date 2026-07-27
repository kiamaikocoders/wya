-- Add latitude/longitude to profiles for "nearby" logic using saved location
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);

CREATE INDEX IF NOT EXISTS idx_profiles_latitude_longitude 
  ON public.profiles(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
