-- Platform admin is a row in admin_users, not the username 'admin'.
-- Users can edit their own username, so the old check let anyone who claimed
-- the name 'admin' (after a rename, demotion, or deletion) become a full admin.

CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.admin_users FROM anon, authenticated;
GRANT SELECT ON public.admin_users TO authenticated;

INSERT INTO public.admin_users (user_id)
SELECT p.id
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.username = 'admin'
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_admin(p_uid uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = p_uid
  );
$function$;

DROP POLICY IF EXISTS "Admins and self can read admin roles" ON public.admin_users;
CREATE POLICY "Admins and self can read admin roles"
  ON public.admin_users FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR public.is_admin());

-- Grant or revoke admin. Admins cannot remove themselves, so at least one admin always remains.
CREATE OR REPLACE FUNCTION public.admin_set_user_role(p_target uuid, p_role text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_target IS NULL OR NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_target) THEN
    RAISE EXCEPTION 'user not found';
  END IF;

  IF p_role = 'admin' THEN
    INSERT INTO public.admin_users (user_id, granted_by)
    VALUES (p_target, auth.uid())
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    IF p_target = auth.uid() THEN
      RAISE EXCEPTION 'cannot remove your own admin access';
    END IF;
    DELETE FROM public.admin_users WHERE user_id = p_target;
  END IF;

  PERFORM public.admin_audit(
    'user_role_change',
    'user',
    p_target::text,
    jsonb_build_object('role', p_role)
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_set_user_role(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, text) TO authenticated;

-- Full profile row for the signed-in user (private columns are not readable directly).
CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT * FROM public.profiles WHERE id = (SELECT auth.uid());
$function$;

REVOKE ALL ON FUNCTION public.get_my_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;

-- Full profile rows for the admin console; filter/paginate with PostgREST on the result.
CREATE OR REPLACE FUNCTION public.admin_profiles()
RETURNS SETOF public.profiles
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT p.* FROM public.profiles p WHERE public.is_admin();
$function$;

REVOKE ALL ON FUNCTION public.admin_profiles() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_profiles() TO authenticated;

-- Audit entries are written by admin RPCs and service-role edge functions only.
REVOKE EXECUTE ON FUNCTION public.admin_audit(text, text, text, jsonb) FROM PUBLIC, anon, authenticated;

-- Policies that inlined the username check.
ALTER POLICY "Only admins can manage categories" ON public.categories USING (public.is_admin());
ALTER POLICY "email_reminder_log_admin_select" ON public.email_reminder_log USING (public.is_admin());
ALTER POLICY "email_send_log_admin_select" ON public.email_send_log USING (public.is_admin());
ALTER POLICY "Admins can manage attendance data" ON public.event_attendance USING (public.is_admin());
ALTER POLICY "Admins can manage all check-ins" ON public.event_checkins USING (public.is_admin());
ALTER POLICY "Admins can update any event" ON public.events USING (public.is_admin()) WITH CHECK (public.is_admin());
ALTER POLICY "Admins can manage featured creators" ON public.featured_creators USING (public.is_admin());
ALTER POLICY "Admins can delete ghost action logs" ON public.ghost_action_log USING (public.is_admin());
ALTER POLICY "newsletter_subscribers_select_own" ON public.newsletter_subscribers
  USING (user_id = (SELECT auth.uid()) OR public.is_admin());
ALTER POLICY "Admins can view all analytics" ON public.revenue_analytics USING (public.is_admin());
ALTER POLICY "Admins can manage all payouts" ON public.revenue_payouts USING (public.is_admin());
ALTER POLICY "Admins can manage all revenue config" ON public.revenue_sharing_config USING (public.is_admin());
ALTER POLICY "Admins can manage all revenue transactions" ON public.revenue_transactions USING (public.is_admin());
ALTER POLICY "Admins can delete any story" ON public.stories USING (public.is_admin());
ALTER POLICY "Admins can update any story" ON public.stories USING (public.is_admin());
ALTER POLICY "Admins can manage languages" ON public.supported_languages USING (public.is_admin());
ALTER POLICY "Admins can manage system translations" ON public.system_translations USING (public.is_admin());
ALTER POLICY "Admins can manage top moments" ON public.top_moments USING (public.is_admin());
ALTER POLICY "Admins can manage all event-images" ON storage.objects
  USING (bucket_id = 'event-images' AND public.is_admin());

-- Redundant with "Admins can delete any story", and it reads profiles.is_ghost as the caller.
DROP POLICY IF EXISTS "Admins can delete ghost stories" ON public.stories;

-- Functions that inlined the username check.
CREATE OR REPLACE FUNCTION public.admin_set_account_status(p_target uuid, p_status text, p_reason text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_target IS NULL OR p_target = auth.uid() THEN
    RAISE EXCEPTION 'invalid target';
  END IF;

  IF p_status NOT IN ('active', 'suspended', 'banned', 'deleted') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_target) THEN
    RAISE EXCEPTION 'user not found';
  END IF;

  IF public.is_admin(p_target) THEN
    RAISE EXCEPTION 'cannot change an admin account this way';
  END IF;

  UPDATE public.profiles SET
    account_status = p_status,
    account_status_reason = p_reason,
    account_status_changed_at = now(),
    account_status_changed_by = auth.uid()
  WHERE id = p_target;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_soft_delete_user(p_target uuid, p_reason text DEFAULT NULL::text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF p_target IS NULL OR p_target = auth.uid() THEN
    RAISE EXCEPTION 'invalid target';
  END IF;

  IF public.is_admin(p_target) THEN
    RAISE EXCEPTION 'cannot delete an admin account';
  END IF;

  UPDATE public.profiles SET
    account_status = 'deleted',
    account_status_reason = COALESCE(p_reason, 'Account removed by administrator'),
    account_status_changed_at = now(),
    account_status_changed_by = auth.uid(),
    full_name = NULL,
    bio = NULL,
    phone = NULL,
    avatar_url = NULL,
    location = NULL,
    latitude = NULL,
    longitude = NULL,
    username = 'deleted_' || replace(p_target::text, '-', '')
  WHERE id = p_target;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_admins(p_type text, p_title text, p_message text, p_link text DEFAULT NULL::text, p_resource_type text DEFAULT NULL::text, p_resource_id integer DEFAULT NULL::integer, p_resource_uuid uuid DEFAULT NULL::uuid, p_data jsonb DEFAULT NULL::jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count integer := 0;
BEGIN
  IF p_type IS NULL OR btrim(p_type) = '' THEN
    RAISE EXCEPTION 'notify_admins: type is required';
  END IF;
  IF p_title IS NULL OR btrim(p_title) = '' THEN
    RAISE EXCEPTION 'notify_admins: title is required';
  END IF;
  IF p_message IS NULL OR btrim(p_message) = '' THEN
    RAISE EXCEPTION 'notify_admins: message is required';
  END IF;

  INSERT INTO public.notifications (
    user_id, type, title, message, link,
    resource_type, resource_id, resource_uuid, data, read
  )
  SELECT
    a.user_id, p_type, p_title, p_message, p_link,
    p_resource_type, p_resource_id, p_resource_uuid, p_data, false
  FROM public.admin_users a;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'notify_admins failed: %', SQLERRM;
    RETURN 0;
END;
$function$;

CREATE OR REPLACE FUNCTION public.trg_admin_notify_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF public.is_admin(NEW.id) THEN
    RETURN NEW;
  END IF;

  PERFORM public.notify_admins(
    'user_signup',
    'New user signed up',
    format(
      '%s joined WYA.',
      COALESCE(NULLIF(NEW.full_name, ''), NULLIF(NEW.username, ''), 'A new user')
    ),
    '/admin/users',
    'user',
    NULL,
    NEW.id,
    jsonb_build_object(
      'user_id', NEW.id,
      'username', NEW.username,
      'location', NEW.location
    )
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.admin_publish_announcement(p_announcement_id bigint)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_ann RECORD;
  v_count INTEGER := 0;
  v_uid UUID;
  v_channel TEXT;
  v_locations TEXT[];
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  SELECT * INTO v_ann
  FROM public.platform_announcements
  WHERE id = p_announcement_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Announcement not found';
  END IF;

  v_channel := COALESCE(v_ann.channel, 'both');
  v_locations := COALESCE(v_ann.audience_locations, '{}');

  IF v_ann.audience = 'location' AND cardinality(v_locations) = 0 THEN
    RAISE EXCEPTION 'Select at least one location for a location-targeted broadcast';
  END IF;

  UPDATE public.platform_announcements
  SET status = 'published', published_at = NOW(), updated_at = NOW()
  WHERE id = p_announcement_id;

  IF v_channel IN ('in_app', 'both') THEN
    FOR v_uid IN
      SELECT p.id
      FROM public.profiles p
      WHERE COALESCE(p.is_ghost, false) = false
        AND (
          v_ann.audience = 'all'
          OR (v_ann.audience = 'admins' AND public.is_admin(p.id))
          OR (v_ann.audience = 'organizers' AND EXISTS (
            SELECT 1 FROM public.events e WHERE e.organizer_id = p.id
          ))
          OR (v_ann.audience = 'attendees' AND NOT public.is_admin(p.id))
          OR (
            v_ann.audience = 'location'
            AND public.profile_matches_announcement_locations(p.id, v_locations)
          )
        )
      LIMIT 2000
    LOOP
      BEGIN
        INSERT INTO public.notifications (user_id, type, title, message, link, read)
        VALUES (
          v_uid,
          'announcement',
          v_ann.title,
          left(v_ann.body, 500),
          NULLIF(trim(COALESCE(v_ann.link, '')), ''),
          false
        );
        v_count := v_count + 1;
      EXCEPTION
        WHEN OTHERS THEN
          NULL;
      END;
    END LOOP;
  END IF;

  UPDATE public.platform_announcements
  SET recipient_count = GREATEST(COALESCE(recipient_count, 0), v_count)
  WHERE id = p_announcement_id;

  PERFORM public.admin_audit(
    'announcement_publish',
    'platform_announcement',
    p_announcement_id::TEXT,
    jsonb_build_object(
      'notified', v_count,
      'audience', v_ann.audience,
      'channel', v_channel,
      'locations', v_locations
    )
  );

  RETURN json_build_object(
    'announcement_id', p_announcement_id,
    'status', 'published',
    'notified_count', v_count,
    'channel', v_channel,
    'audience', v_ann.audience,
    'locations', v_locations
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_emails(user_ids uuid[])
RETURNS TABLE(user_id uuid, email text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can access user emails';
  END IF;

  RETURN QUERY
  SELECT au.id, au.email::TEXT
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$function$;

CREATE OR REPLACE FUNCTION public.export_user_data(user_uuid uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  user_data JSON;
BEGIN
  IF auth.uid() IS DISTINCT FROM user_uuid AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Can only export your own data';
  END IF;

  SELECT json_build_object(
    'profile', (
      SELECT to_json(p.*) FROM public.profiles p WHERE p.id = user_uuid
    ),
    'events', (
      SELECT json_agg(to_json(e.*)) FROM public.events e WHERE e.organizer_id = user_uuid
    ),
    'tickets', (
      SELECT json_agg(to_json(t.*)) FROM public.tickets t WHERE t.user_id = user_uuid
    ),
    'payments', (
      SELECT json_agg(to_json(p.*)) FROM public.payments p WHERE p.user_id = user_uuid
    ),
    'notifications', (
      SELECT json_agg(to_json(n.*)) FROM public.notifications n WHERE n.user_id = user_uuid
    ),
    'messages_sent', (
      SELECT json_agg(to_json(m.*)) FROM public.messages m WHERE m.sender_id = user_uuid
    ),
    'messages_received', (
      SELECT json_agg(to_json(m.*)) FROM public.messages m WHERE m.receiver_id = user_uuid
    ),
    'favorites', (
      SELECT json_agg(to_json(f.*)) FROM public.favorites f WHERE f.user_id = user_uuid
    ),
    'forum_posts', (
      SELECT json_agg(to_json(fp.*)) FROM public.forum_posts fp WHERE fp.user_id = user_uuid
    ),
    'stories', (
      SELECT json_agg(to_json(s.*)) FROM public.stories s WHERE s.user_id = user_uuid
    ),
    'exported_at', NOW()
  ) INTO user_data;

  RETURN user_data;
END;
$function$;

CREATE OR REPLACE FUNCTION public.anonymize_user_data(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS DISTINCT FROM user_uuid AND NOT public.is_admin() THEN
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
$function$;

CREATE OR REPLACE FUNCTION public.delete_user_data(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF auth.uid() IS DISTINCT FROM user_uuid AND NOT public.is_admin() THEN
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
$function$;
