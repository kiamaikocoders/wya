# Apply Storage RLS Fix - Quick Guide

## Problem
Getting `403 Unauthorized` error when uploading files in Ghost Management:
```
Error uploading file: { statusCode: "403", error: "Unauthorized", message: "new row violates row-level security policy" }
```

## Solution
Run the SQL migration to add storage policies that allow admin uploads.

## How to Apply

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy the entire contents of: `supabase/migrations/20250130_fix_storage_rls_for_admin.sql`
3. Paste into SQL Editor
4. Click **Run**

### Option 2: Quick SQL (Copy & Paste)

Copy and paste this SQL into Supabase Dashboard → SQL Editor:

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload to media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read from media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own uploads in media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own uploads in media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload anywhere in media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update anywhere in media bucket" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete anywhere in media bucket" ON storage.objects;

-- Allow authenticated users to upload to ghost-content folder
CREATE POLICY "Authenticated users can upload to media bucket"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = 'ghost-content'
);

-- Allow anyone to read from media bucket
CREATE POLICY "Anyone can read from media bucket"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'media');

-- Allow authenticated users to update their own uploads
CREATE POLICY "Users can update their own uploads in media bucket"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = 'ghost-content'
);

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Users can delete their own uploads in media bucket"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = 'ghost-content'
);

-- Admin can upload anywhere in media bucket
CREATE POLICY "Admins can upload anywhere in media bucket"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'media' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND username = 'admin'
  )
);

-- Admin can update anywhere in media bucket
CREATE POLICY "Admins can update anywhere in media bucket"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'media' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND username = 'admin'
  )
);

-- Admin can delete anywhere in media bucket
CREATE POLICY "Admins can delete anywhere in media bucket"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'media' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND username = 'admin'
  )
);
```

## What This Does

- ✅ Enables RLS on `storage.objects` table
- ✅ Allows authenticated users to upload to `ghost-content/` folder
- ✅ Allows admins to upload anywhere in `media` bucket
- ✅ Allows public read access to `media` bucket
- ✅ Allows users to update/delete their own uploads

## After Applying

1. Refresh your browser
2. Try uploading a file again in Ghost Management
3. The upload should now work! ✅
