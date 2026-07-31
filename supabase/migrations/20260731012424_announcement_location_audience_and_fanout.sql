-- Location-targeted broadcasts + richer audience matching for publish fan-out.

ALTER TABLE public.platform_announcements
  ADD COLUMN IF NOT EXISTS audience_locations TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.platform_announcements
  DROP CONSTRAINT IF EXISTS platform_announcements_audience_check;

ALTER TABLE public.platform_announcements
  ADD CONSTRAINT platform_announcements_audience_check
  CHECK (audience = ANY (ARRAY[
    'all'::text,
    'attendees'::text,
    'organizers'::text,
    'admins'::text,
    'location'::text
  ]));

COMMENT ON COLUMN public.platform_announcements.audience_locations IS
  'When audience = location, match profiles whose location / home_base / preferred_cities contain any of these labels (case-insensitive).';

CREATE OR REPLACE FUNCTION public.profile_matches_announcement_locations(
  p_profile_id UUID,
  p_locations TEXT[]
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN p_locations IS NULL OR cardinality(p_locations) = 0 THEN false
    ELSE EXISTS (
      SELECT 1
      FROM public.profiles p
      LEFT JOIN public.user_onboarding_preferences o ON o.user_id = p.id
      WHERE p.id = p_profile_id
        AND EXISTS (
          SELECT 1
          FROM unnest(p_locations) AS loc(label)
          WHERE NULLIF(btrim(loc.label), '') IS NOT NULL
            AND (
              (p.location IS NOT NULL AND p.location ILIKE '%' || btrim(loc.label) || '%')
              OR (o.home_base IS NOT NULL AND o.home_base ILIKE '%' || btrim(loc.label) || '%')
              OR (
                o.preferred_cities IS NOT NULL
                AND EXISTS (
                  SELECT 1
                  FROM unnest(o.preferred_cities) AS city(name)
                  WHERE city.name ILIKE '%' || btrim(loc.label) || '%'
                     OR btrim(loc.label) ILIKE '%' || city.name || '%'
                )
              )
            )
        )
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.admin_publish_announcement(p_announcement_id BIGINT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- In-app fan-out when channel includes in_app
  IF v_channel IN ('in_app', 'both') THEN
    FOR v_uid IN
      SELECT p.id
      FROM public.profiles p
      WHERE COALESCE(p.is_ghost, false) = false
        AND (
          v_ann.audience = 'all'
          OR (v_ann.audience = 'admins' AND p.username = 'admin')
          OR (v_ann.audience = 'organizers' AND EXISTS (
            SELECT 1 FROM public.events e WHERE e.organizer_id = p.id
          ))
          OR (v_ann.audience = 'attendees' AND p.username IS DISTINCT FROM 'admin')
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
$$;

GRANT EXECUTE ON FUNCTION public.profile_matches_announcement_locations(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_publish_announcement(BIGINT) TO authenticated;
