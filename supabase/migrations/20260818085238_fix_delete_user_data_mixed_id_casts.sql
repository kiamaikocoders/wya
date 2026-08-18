-- Make admin/user hard-delete work across mixed text/uuid reference columns.
-- Some older tables still store user ids as text while newer tables use uuid.
-- Compare through ::text so the cleanup function does not fail with uuid=text.

CREATE OR REPLACE FUNCTION public.delete_user_data(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, pg_temp
AS $$
BEGIN
  IF auth.uid() IS DISTINCT FROM user_uuid AND NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND username = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Can only delete your own data';
  END IF;

  DELETE FROM public.consent_audit WHERE user_id::text = user_uuid::text;
  DELETE FROM public.data_subject_requests WHERE user_id::text = user_uuid::text;

  DELETE FROM public.story_likes WHERE user_id::text = user_uuid::text;
  DELETE FROM public.story_comments WHERE user_id::text = user_uuid::text;
  DELETE FROM public.stories WHERE user_id::text = user_uuid::text;

  DELETE FROM public.post_likes WHERE user_id::text = user_uuid::text;
  DELETE FROM public.forum_comments WHERE user_id::text = user_uuid::text;
  DELETE FROM public.forum_posts WHERE user_id::text = user_uuid::text;

  DELETE FROM public.survey_responses WHERE user_id::text = user_uuid::text;
  DELETE FROM public.surveys WHERE user_id::text = user_uuid::text;

  DELETE FROM public.favorites WHERE user_id::text = user_uuid::text;
  DELETE FROM public.follows
  WHERE follower_id::text = user_uuid::text OR following_id::text = user_uuid::text;

  DELETE FROM public.messages
  WHERE sender_id::text = user_uuid::text OR receiver_id::text = user_uuid::text;
  DELETE FROM public.notifications WHERE user_id::text = user_uuid::text;

  DELETE FROM public.tickets WHERE user_id::text = user_uuid::text;
  DELETE FROM public.payments WHERE user_id::text = user_uuid::text;
  DELETE FROM public.ticket_transfers
  WHERE sender_id::text = user_uuid::text OR recipient_id::text = user_uuid::text;

  UPDATE public.events SET organizer_id = NULL WHERE organizer_id = user_uuid;

  DELETE FROM public.profiles WHERE id = user_uuid;

  RETURN TRUE;
END;
$$;
