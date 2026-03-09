-- Function to get events within radius (Haversine formula)
-- Uses plain SQL, no PostGIS required
CREATE OR REPLACE FUNCTION public.events_within_radius(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION DEFAULT 50,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0,
  p_date_from TEXT DEFAULT NULL
)
RETURNS TABLE (
  id INTEGER,
  title TEXT,
  description TEXT,
  date TIMESTAMPTZ,
  end_date DATE,
  "time" TIME,
  location TEXT,
  image_url TEXT,
  capacity INTEGER,
  price DECIMAL,
  category TEXT,
  organizer_id UUID,
  featured BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  tags TEXT[],
  latitude DECIMAL,
  longitude DECIMAL,
  performing_artists TEXT[],
  distance_km DOUBLE PRECISION
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.title,
    e.description,
    e.date,
    e.end_date,
    e.time,
    e.location,
    e.image_url,
    e.capacity,
    e.price,
    e.category,
    e.organizer_id,
    e.featured,
    e.created_at,
    e.updated_at,
    e.tags,
    e.latitude,
    e.longitude,
    e.performing_artists,
    (6371 * acos(
      LEAST(1, GREATEST(-1,
        cos(radians(p_lat)) * cos(radians(e.latitude::float8)) *
        cos(radians(e.longitude::float8) - radians(p_lng)) +
        sin(radians(p_lat)) * sin(radians(e.latitude::float8))
      ))
    ))::DOUBLE PRECISION AS distance_km
  FROM public.events e
  WHERE
    e.latitude IS NOT NULL
    AND e.longitude IS NOT NULL
    AND (6371 * acos(
      LEAST(1, GREATEST(-1,
        cos(radians(p_lat)) * cos(radians(e.latitude::float8)) *
        cos(radians(e.longitude::float8) - radians(p_lng)) +
        sin(radians(p_lat)) * sin(radians(e.latitude::float8))
      ))
    )) <= p_radius_km
    AND (p_date_from IS NULL OR e.date >= p_date_from::date)
  ORDER BY distance_km ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Count of events within radius (for pagination)
CREATE OR REPLACE FUNCTION public.events_within_radius_count(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_radius_km DOUBLE PRECISION DEFAULT 50,
  p_date_from TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cnt INTEGER;
BEGIN
  SELECT COUNT(*)::INTEGER INTO cnt
  FROM public.events e
  WHERE
    e.latitude IS NOT NULL
    AND e.longitude IS NOT NULL
    AND (6371 * acos(
      LEAST(1, GREATEST(-1,
        cos(radians(p_lat)) * cos(radians(e.latitude::float8)) *
        cos(radians(e.longitude::float8) - radians(p_lng)) +
        sin(radians(p_lat)) * sin(radians(e.latitude::float8))
      ))
    )) <= p_radius_km
    AND (p_date_from IS NULL OR e.date >= p_date_from::date);
  RETURN cnt;
END;
$$;
