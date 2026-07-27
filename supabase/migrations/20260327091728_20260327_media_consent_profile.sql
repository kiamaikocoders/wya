-- Promotional use of photographs, video, and audio (media consent form)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS media_consent BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS media_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS media_consent_version TEXT;

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
BEGIN
  mk_ts := NULLIF(TRIM(meta->>'marketing_consent_at'), '');
  pk_ts := NULLIF(TRIM(meta->>'privacy_accepted_at'), '');
  IF pk_ts IS NULL THEN
    pk_ts := NULLIF(TRIM(meta->>'privacy_consent_at'), '');
  END IF;
  med_ts := NULLIF(TRIM(meta->>'media_consent_at'), '');

  INSERT INTO public.profiles (
    id,
    full_name,
    username,
    phone,
    date_of_birth,
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

CREATE OR REPLACE FUNCTION public.anonymize_user_data(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM user_uuid AND NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND username = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Can only anonymize your own data';
  END IF;

  UPDATE public.profiles
  SET
    full_name = 'Deleted User',
    username = 'deleted_user_' || EXTRACT(EPOCH FROM NOW())::TEXT,
    avatar_url = NULL,
    bio = NULL,
    location = NULL,
    latitude = NULL,
    longitude = NULL,
    phone = NULL,
    date_of_birth = NULL,
    terms_version_accepted = NULL,
    terms_accepted_at = NULL,
    privacy_version_accepted = NULL,
    privacy_accepted_at = NULL,
    marketing_consent = FALSE,
    marketing_consent_at = NULL,
    location_consent = FALSE,
    location_consent_at = NULL,
    organizer_content_sharing_opt_in = FALSE,
    media_consent = FALSE,
    media_consent_at = NULL,
    media_consent_version = NULL,
    email_notifications = FALSE,
    push_notifications = FALSE,
    profile_visibility = 'private',
    two_factor_auth = FALSE,
    updated_at = NOW()
  WHERE id = user_uuid;

  UPDATE public.messages
  SET content = '[Message deleted by user]'
  WHERE sender_id = user_uuid::TEXT;

  UPDATE public.forum_posts
  SET
    title = '[Post deleted by user]',
    content = '[Content deleted by user]'
  WHERE user_id = user_uuid::TEXT;

  UPDATE public.forum_comments
  SET content = '[Comment deleted by user]'
  WHERE user_id = user_uuid::TEXT;

  UPDATE public.stories
  SET
    caption = '[Story deleted by user]',
    content = '[Content deleted by user]',
    media_url = NULL
  WHERE user_id = user_uuid::TEXT;

  UPDATE public.story_comments
  SET content = '[Comment deleted by user]'
  WHERE user_id = user_uuid::TEXT;

  RETURN TRUE;
END;
$$;
