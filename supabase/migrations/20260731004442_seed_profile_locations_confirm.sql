-- Seed missing real-user profile locations + one-time confirm flag.
-- 1) Onboarding home_base / preferred_cities → profile location
-- 2) Remaining no-location real users → Nairobi, Thika, Kiambu, Kitengela, Rongai, Nakuru
-- Users get a one-time in-app prompt; Settings can override permanently.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS location_source text,
  ADD COLUMN IF NOT EXISTS location_confirm_needed boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.location_source IS
  'user | seeded_onboarding | seeded_default — how location was set';
COMMENT ON COLUMN public.profiles.location_confirm_needed IS
  'When true, show one-time toast asking user to confirm or update location';

CREATE OR REPLACE FUNCTION public._atlas_seed_jitter(p_id uuid, p_axis int)
RETURNS double precision
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT ((abs(hashtext(p_id::text || ':' || p_axis::text)) % 1000) / 1000.0 - 0.5) * 0.04;
$$;

WITH no_loc AS (
  SELECT p.id
  FROM public.profiles p
  WHERE COALESCE(p.is_ghost, false) = false
    AND (p.latitude IS NULL OR p.longitude IS NULL)
    AND (p.location IS NULL OR btrim(p.location) = '')
),
onboarding_seed AS (
  SELECT
    n.id,
    COALESCE(
      NULLIF(btrim(o.home_base), ''),
      NULLIF(btrim(o.preferred_cities[1]), ''),
      'Nairobi'
    ) AS raw_label
  FROM no_loc n
  JOIN public.user_onboarding_preferences o ON o.user_id = n.id
  WHERE (o.home_base IS NOT NULL AND btrim(o.home_base) <> '')
     OR (o.preferred_cities IS NOT NULL AND cardinality(o.preferred_cities) > 0)
),
onboarding_resolved AS (
  SELECT
    s.id,
    CASE
      WHEN lower(s.raw_label) LIKE '%westlands%' THEN 'Westlands, Nairobi'
      WHEN lower(s.raw_label) LIKE '%hurlingham%' THEN 'Hurlingham, Nairobi'
      WHEN lower(s.raw_label) LIKE '%karen%' THEN 'Karen, Nairobi'
      WHEN lower(s.raw_label) LIKE '%riara%' THEN 'Riara Road, Nairobi'
      WHEN lower(s.raw_label) LIKE '%nakuru%' THEN 'Nakuru'
      WHEN lower(s.raw_label) LIKE '%thika%' THEN 'Thika'
      WHEN lower(s.raw_label) LIKE '%kiambu%' THEN 'Kiambu'
      WHEN lower(s.raw_label) LIKE '%kitengela%' THEN 'Kitengela'
      WHEN lower(s.raw_label) LIKE '%rongai%' THEN 'Rongai'
      ELSE 'Nairobi'
    END AS label,
    CASE
      WHEN lower(s.raw_label) LIKE '%westlands%' THEN -1.2674::float8
      WHEN lower(s.raw_label) LIKE '%hurlingham%' THEN -1.2929::float8
      WHEN lower(s.raw_label) LIKE '%karen%' THEN -1.3197::float8
      WHEN lower(s.raw_label) LIKE '%riara%' THEN -1.3030::float8
      WHEN lower(s.raw_label) LIKE '%nakuru%' THEN -0.3031::float8
      WHEN lower(s.raw_label) LIKE '%thika%' THEN -1.0333::float8
      WHEN lower(s.raw_label) LIKE '%kiambu%' THEN -1.1714::float8
      WHEN lower(s.raw_label) LIKE '%kitengela%' THEN -1.4767::float8
      WHEN lower(s.raw_label) LIKE '%rongai%' THEN -1.3965::float8
      ELSE -1.2921::float8
    END AS base_lat,
    CASE
      WHEN lower(s.raw_label) LIKE '%westlands%' THEN 36.8110::float8
      WHEN lower(s.raw_label) LIKE '%hurlingham%' THEN 36.7965::float8
      WHEN lower(s.raw_label) LIKE '%karen%' THEN 36.7086::float8
      WHEN lower(s.raw_label) LIKE '%riara%' THEN 36.7850::float8
      WHEN lower(s.raw_label) LIKE '%nakuru%' THEN 36.0800::float8
      WHEN lower(s.raw_label) LIKE '%thika%' THEN 37.0693::float8
      WHEN lower(s.raw_label) LIKE '%kiambu%' THEN 36.8356::float8
      WHEN lower(s.raw_label) LIKE '%kitengela%' THEN 36.9563::float8
      WHEN lower(s.raw_label) LIKE '%rongai%' THEN 36.7550::float8
      ELSE 36.8219::float8
    END AS base_lng
  FROM onboarding_seed s
),
upd_onboarding AS (
  UPDATE public.profiles p
  SET
    location = r.label,
    latitude = r.base_lat + public._atlas_seed_jitter(r.id, 1),
    longitude = r.base_lng + public._atlas_seed_jitter(r.id, 2),
    location_source = 'seeded_onboarding',
    location_confirm_needed = true,
    updated_at = now()
  FROM onboarding_resolved r
  WHERE p.id = r.id
  RETURNING p.id
),
remaining AS (
  SELECT n.id,
         abs(hashtext(n.id::text)) % 6 AS city_i
  FROM no_loc n
  WHERE NOT EXISTS (SELECT 1 FROM upd_onboarding u WHERE u.id = n.id)
),
remaining_cities AS (
  SELECT
    r.id,
    CASE r.city_i
      WHEN 0 THEN 'Nairobi'
      WHEN 1 THEN 'Thika'
      WHEN 2 THEN 'Kiambu'
      WHEN 3 THEN 'Kitengela'
      WHEN 4 THEN 'Rongai'
      ELSE 'Nakuru'
    END AS label,
    CASE r.city_i
      WHEN 0 THEN -1.2921::float8
      WHEN 1 THEN -1.0333::float8
      WHEN 2 THEN -1.1714::float8
      WHEN 3 THEN -1.4767::float8
      WHEN 4 THEN -1.3965::float8
      ELSE -0.3031::float8
    END AS base_lat,
    CASE r.city_i
      WHEN 0 THEN 36.8219::float8
      WHEN 1 THEN 37.0693::float8
      WHEN 2 THEN 36.8356::float8
      WHEN 3 THEN 36.9563::float8
      WHEN 4 THEN 36.7550::float8
      ELSE 36.0800::float8
    END AS base_lng
  FROM remaining r
)
UPDATE public.profiles p
SET
  location = rc.label,
  latitude = rc.base_lat + public._atlas_seed_jitter(rc.id, 1),
  longitude = rc.base_lng + public._atlas_seed_jitter(rc.id, 2),
  location_source = 'seeded_default',
  location_confirm_needed = true,
  updated_at = now()
FROM remaining_cities rc
WHERE p.id = rc.id;

DROP FUNCTION IF EXISTS public._atlas_seed_jitter(uuid, int);
