-- Fix Storage RLS Policies for Admin Uploads
-- This migration ensures admins can upload files to storage buckets

-- ==============================================
-- ENABLE RLS ON STORAGE.OBJECTS (if not already enabled)
-- ==============================================
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- STORAGE POLICIES FOR MEDIA BUCKET
-- ==============================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload to media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read from media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own uploads in media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads in media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload anywhere in media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update anywhere in media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete anywhere in media bucket" ON storage.objects;

-- Allow authenticated users to upload to media bucket (ghost-content folder)
CREATE POLICY "Authenticated users can upload to media bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = 'ghost-content'
);

-- Allow anyone to read from media bucket (it's public)
CREATE POLICY "Anyone can read from media bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'media');

-- Allow authenticated users to update their own uploads in media bucket
CREATE POLICY "Users can update their own uploads in media bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = 'ghost-content'
);

-- Allow authenticated users to delete their own uploads in media bucket
CREATE POLICY "Users can delete their own uploads in media bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = 'ghost-content'
);

-- Admin can upload anywhere in media bucket
CREATE POLICY "Admins can upload anywhere in media bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'media' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND username = 'admin'
  )
);

-- Admin can update anywhere in media bucket
CREATE POLICY "Admins can update anywhere in media bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'media' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND username = 'admin'
  )
);

-- Admin can delete anywhere in media bucket
CREATE POLICY "Admins can delete anywhere in media bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND username = 'admin'
  )
);
