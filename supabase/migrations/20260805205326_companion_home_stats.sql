-- Public aggregate stats for the light-web companion home strip.

CREATE OR REPLACE FUNCTION public.get_companion_home_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'events_this_week', (
      SELECT count(*)::int
      FROM public.events e
      WHERE COALESCE(e.event_last_day, (e.date AT TIME ZONE 'Africa/Nairobi')::date) >= (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Nairobi')::date
        AND COALESCE(e.event_first_day, (e.date AT TIME ZONE 'Africa/Nairobi')::date)
          < ((CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Nairobi')::date + 7)
    ),
    'active_users', (
      SELECT count(*)::int
      FROM public.profiles p
      WHERE COALESCE(p.account_status, 'active') = 'active'
    ),
    'cities', (
      SELECT count(DISTINCT lower(trim(split_part(e.location, ',', 1))))::int
      FROM public.events e
      WHERE e.location IS NOT NULL
        AND trim(e.location) <> ''
    )
  );
$$;

REVOKE ALL ON FUNCTION public.get_companion_home_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_companion_home_stats() TO anon, authenticated;

COMMENT ON FUNCTION public.get_companion_home_stats() IS
  'Aggregate home stats for the authenticated light-web companion (events this week, active users, cities).';
