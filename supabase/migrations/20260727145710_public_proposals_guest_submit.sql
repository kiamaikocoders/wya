-- Public / guest event proposals: nullable submitter, required contact email, guest image uploads.

ALTER TABLE public.proposals
  ALTER COLUMN submitted_by DROP NOT NULL;

-- Backfill any legacy null contact emails before enforcing NOT NULL
UPDATE public.proposals
SET contact_email = COALESCE(NULLIF(trim(contact_email), ''), 'unknown@wya.local')
WHERE contact_email IS NULL OR trim(contact_email) = '';

ALTER TABLE public.proposals
  ALTER COLUMN contact_email SET NOT NULL;

-- Lookup auth user by email (service role / edge functions / admin RPC).
CREATE OR REPLACE FUNCTION public.lookup_auth_user_id_by_email(p_email text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = auth, public
AS $$
  SELECT id
  FROM auth.users
  WHERE lower(email) = lower(trim(p_email))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.lookup_auth_user_id_by_email(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lookup_auth_user_id_by_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lookup_auth_user_id_by_email(text) TO service_role;

COMMENT ON FUNCTION public.lookup_auth_user_id_by_email(text) IS
  'Returns auth.users.id when email matches a registered account; used for proposal registration detection.';

-- Allow anonymous + authenticated uploads under proposals/guest/*
DROP POLICY IF EXISTS "Anyone can upload guest proposal images" ON storage.objects;
CREATE POLICY "Anyone can upload guest proposal images"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'event-images'
  AND (storage.foldername(name))[1] = 'proposals'
  AND (storage.foldername(name))[2] = 'guest'
);

-- Ensure public can read event-images
DROP POLICY IF EXISTS "Public can view event-images" ON storage.objects;
CREATE POLICY "Public can view event-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'event-images');
