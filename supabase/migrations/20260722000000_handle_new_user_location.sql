-- Persist signup location (label + coords) from auth user_metadata onto profiles

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::JSONB);
  mk_ts TEXT;
  pk_ts TEXT;
  med_ts TEXT;
  loc_lat DOUBLE PRECISION;
  loc_lng DOUBLE PRECISION;
BEGIN
  mk_ts := NULLIF(TRIM(meta->>'marketing_consent_at'), '');
  pk_ts := NULLIF(TRIM(meta->>'privacy_accepted_at'), '');
  IF pk_ts IS NULL THEN
    pk_ts := NULLIF(TRIM(meta->>'privacy_consent_at'), '');
  END IF;
  med_ts := NULLIF(TRIM(meta->>'media_consent_at'), '');

  BEGIN
    loc_lat := NULLIF(TRIM(meta->>'latitude'), '')::DOUBLE PRECISION;
  EXCEPTION WHEN OTHERS THEN
    loc_lat := NULL;
  END;
  BEGIN
    loc_lng := NULLIF(TRIM(meta->>'longitude'), '')::DOUBLE PRECISION;
  EXCEPTION WHEN OTHERS THEN
    loc_lng := NULL;
  END;

  INSERT INTO public.profiles (
    id,
    full_name,
    username,
    phone,
    date_of_birth,
    location,
    latitude,
    longitude,
    terms_version_accepted,
    terms_accepted_at,
    privacy_version_accepted,
    privacy_accepted_at,
    marketing_consent,
    marketing_consent_at,
    location_consent,
    location_consent_at,
    organizer_content_sharing_opt_in,
    media_consent,
    media_consent_at,
    media_consent_version
  )
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(meta->>'full_name'), ''), SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NULLIF(TRIM(meta->>'username'), ''), SPLIT_PART(NEW.email, '@', 1)),
    NULLIF(TRIM(meta->>'phone'), ''),
    CASE WHEN NULLIF(TRIM(meta->>'date_of_birth'), '') IS NULL THEN NULL ELSE (meta->>'date_of_birth')::DATE END,
    NULLIF(TRIM(meta->>'location'), ''),
    loc_lat,
    loc_lng,
    NULLIF(TRIM(meta->>'terms_version_accepted'), ''),
    CASE WHEN NULLIF(TRIM(meta->>'terms_accepted_at'), '') IS NULL THEN NULL ELSE (meta->>'terms_accepted_at')::TIMESTAMPTZ END,
    NULLIF(TRIM(meta->>'privacy_version_accepted'), ''),
    CASE WHEN pk_ts IS NULL THEN NULL ELSE pk_ts::TIMESTAMPTZ END,
    COALESCE((meta->>'marketing_consent')::BOOLEAN, FALSE),
    CASE WHEN mk_ts IS NULL THEN NULL ELSE mk_ts::TIMESTAMPTZ END,
    COALESCE((meta->>'location_consent')::BOOLEAN, FALSE),
    CASE
      WHEN NULLIF(TRIM(meta->>'location_consent_at'), '') IS NOT NULL
        THEN (meta->>'location_consent_at')::TIMESTAMPTZ
      WHEN (meta->>'location_consent')::BOOLEAN IS TRUE THEN NOW()
      ELSE NULL
    END,
    COALESCE((meta->>'organizer_content_sharing_opt_in')::BOOLEAN, TRUE),
    COALESCE((meta->>'media_consent')::BOOLEAN, FALSE),
    CASE WHEN med_ts IS NULL THEN NULL ELSE med_ts::TIMESTAMPTZ END,
    NULLIF(TRIM(meta->>'media_consent_version'), '')
  );

  RETURN NEW;
END;
$$;
