-- Users can update their own profile row; is_ghost exempts an account from the posting and
-- legal consent gates, so only admins and server-side code (no auth.uid()) may change it.
CREATE OR REPLACE FUNCTION public.prevent_profile_account_status_user_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.account_status IS DISTINCT FROM OLD.account_status THEN
    IF NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only administrators can change account_status';
    END IF;
  END IF;

  IF NEW.is_ghost IS DISTINCT FROM OLD.is_ghost THEN
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Only administrators can change is_ghost';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Ghost accounts are an admin tool; do not reveal them to the public.
CREATE OR REPLACE FUNCTION public.get_ghost_users_by_persona(p_persona_group_id integer DEFAULT NULL::integer)
RETURNS TABLE(id uuid, username text, full_name text, persona_group_id integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Admin only';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.username,
    p.full_name,
    COALESCE(pg.id, NULL)::INTEGER as persona_group_id
  FROM public.profiles p
  LEFT JOIN public.ghost_persona_groups pg ON pg.id = p_persona_group_id
  WHERE p.is_ghost = TRUE
  AND (p_persona_group_id IS NULL OR pg.id = p_persona_group_id)
  ORDER BY p.created_at;
END;
$function$;

REVOKE ALL ON FUNCTION public.get_ghost_users_by_persona(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_ghost_users_by_persona(integer) TO authenticated;
