-- Update Constraints to Allow Deletion
-- This migration updates policies to allow proper deletion

-- ==============================================
-- UPDATE STORAGE DELETION POLICIES
-- ==============================================

-- Allow admins to delete any file in media bucket
DROP POLICY IF EXISTS "Admins can delete anywhere in media bucket" ON storage.objects;

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

-- Allow authenticated users to delete files in ghost-content folder
DROP POLICY IF EXISTS "Users can delete their own uploads in media bucket" ON storage.objects;

CREATE POLICY "Users can delete their own uploads in media bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'media' AND
  (storage.foldername(name))[1] = 'ghost-content'
);

-- ==============================================
-- ENSURE RLS POLICIES ALLOW DELETION
-- ==============================================

-- Update ghost_action_queue RLS to allow deletion
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ghost_action_queue') THEN
    DROP POLICY IF EXISTS "Admins can delete ghost actions" ON public.ghost_action_queue;
    
    CREATE POLICY "Admins can delete ghost actions" ON public.ghost_action_queue
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND username = 'admin'
        )
      );
  END IF;
END $$;

-- Update ghost_action_log RLS to allow deletion
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ghost_action_log') THEN
    DROP POLICY IF EXISTS "Admins can delete ghost action logs" ON public.ghost_action_log;
    
    CREATE POLICY "Admins can delete ghost action logs" ON public.ghost_action_log
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE id = auth.uid() AND username = 'admin'
        )
      );
  END IF;
END $$;
