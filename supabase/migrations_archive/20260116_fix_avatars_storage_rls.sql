-- Fix avatars Storage RLS
-- Allow authenticated users to upload/update/delete only within their own folder: <auth.uid()>/...

-- NOTE:
-- Managing policies on `storage.objects` requires elevated privileges (table owner).
-- In Supabase hosted projects, apply this via the SQL editor / CLI using a privileged connection.

-- Ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing avatars policies (avoid duplicates / conflicts)
DROP POLICY IF EXISTS "Anyone can read from avatars bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

-- Public read (avatars bucket is public)
CREATE POLICY "Anyone can read from avatars bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Upload: only into folder named after auth.uid()
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Update: only within their folder (supports upsert / overwrites)
CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Delete: only within their folder
CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

