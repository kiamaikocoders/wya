-- Bind public-function name resolution to trusted schemas.
-- This preserves each function's existing implementation and privileges.
ALTER FUNCTION public.events_within_radius(
  double precision,
  double precision,
  double precision,
  integer,
  integer,
  text
) SET search_path TO pg_catalog, public;

ALTER FUNCTION public.events_within_radius_count(
  double precision,
  double precision,
  double precision,
  text
) SET search_path TO pg_catalog, public;

ALTER FUNCTION public.update_event_save_count()
  SET search_path TO pg_catalog, public;
