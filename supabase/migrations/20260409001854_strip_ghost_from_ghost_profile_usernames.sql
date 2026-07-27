-- Strip the substring "ghost" (case-insensitive) from usernames on ghost profiles.
-- Avoids unique(username) collisions by suffixing with id fragments when needed.

DO $mig$
DECLARE
  r RECORD;
  base TEXT;
  new_u TEXT;
  id_suf TEXT;
BEGIN
  FOR r IN
    SELECT id, username FROM public.profiles
    WHERE COALESCE(is_ghost, false) = true
      AND username IS NOT NULL
      AND username ~* 'ghost'
  LOOP
    base := NULLIF(
      trim(both '_' FROM regexp_replace(
        regexp_replace(lower(r.username), 'ghost', '', 'gi'),
        '_+',
        '_',
        'g'
      )),
      ''
    );
    IF base IS NULL THEN
      base := 'user';
    END IF;
    id_suf := left(replace(r.id::text, '-', ''), 8);
    new_u := base;
    IF EXISTS (SELECT 1 FROM public.profiles p WHERE p.username = new_u AND p.id <> r.id) THEN
      new_u := base || '_' || id_suf;
    END IF;
    IF EXISTS (SELECT 1 FROM public.profiles p WHERE p.username = new_u AND p.id <> r.id) THEN
      new_u := 'user_' || replace(r.id::text, '-', '');
    END IF;
    UPDATE public.profiles
    SET username = new_u,
        updated_at = COALESCE(updated_at, now())
    WHERE id = r.id;
  END LOOP;
END;
$mig$;
