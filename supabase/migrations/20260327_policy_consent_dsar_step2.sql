-- Depends on 20260327_policy_consent_dsar_step1.sql — handle_new_user, GDPR delete/anonymize

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
BEGIN
  mk_ts := NULLIF(TRIM(meta->>'marketing_consent_at'), '');
  pk_ts := NULLIF(TRIM(meta->>'privacy_accepted_at'), '');
  IF pk_ts IS NULL THEN
    pk_ts := NULLIF(TRIM(meta->>'privacy_consent_at'), '');
  END IF;

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
    organizer_content_sharing_opt_in
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
    COALESCE((meta->>'organizer_content_sharing_opt_in')::BOOLEAN, TRUE)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DROP FUNCTION IF EXISTS public.delete_user_data(UUID);

CREATE OR REPLACE FUNCTION public.delete_user_data(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM user_uuid AND NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND username = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Can only delete your own data';
  END IF;

  DELETE FROM public.consent_audit WHERE user_id = user_uuid;
  DELETE FROM public.data_subject_requests WHERE user_id = user_uuid;

  DELETE FROM public.story_likes WHERE user_id = user_uuid::TEXT;
  DELETE FROM public.story_comments WHERE user_id = user_uuid::TEXT;
  DELETE FROM public.stories WHERE user_id = user_uuid::TEXT;

  DELETE FROM public.post_likes WHERE user_id = user_uuid::TEXT;
  DELETE FROM public.forum_comments WHERE user_id = user_uuid::TEXT;
  DELETE FROM public.forum_posts WHERE user_id = user_uuid::TEXT;

  DELETE FROM public.survey_responses WHERE user_id = user_uuid::TEXT;
  DELETE FROM public.surveys WHERE user_id = user_uuid::TEXT;

  DELETE FROM public.favorites WHERE user_id = user_uuid::TEXT;
  DELETE FROM public.follows WHERE follower_id = user_uuid::TEXT OR following_id = user_uuid::TEXT;

  DELETE FROM public.messages WHERE sender_id = user_uuid::TEXT OR receiver_id = user_uuid::TEXT;
  DELETE FROM public.notifications WHERE user_id = user_uuid::TEXT;

  DELETE FROM public.tickets WHERE user_id = user_uuid::TEXT;
  DELETE FROM public.payments WHERE user_id = user_uuid::TEXT;

  UPDATE public.events SET organizer_id = NULL WHERE organizer_id = user_uuid;

  DELETE FROM public.profiles WHERE id = user_uuid;

  RETURN TRUE;
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
