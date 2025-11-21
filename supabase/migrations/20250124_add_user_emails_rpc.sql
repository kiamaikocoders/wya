-- Add RPC function to get user emails for admin users
-- This function allows admins to fetch emails from auth.users table

CREATE OR REPLACE FUNCTION public.get_user_emails(user_ids UUID[])
RETURNS TABLE(id UUID, email TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user is an admin
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND username = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: Only admins can access user emails';
  END IF;

  -- Return user IDs and emails from auth.users
  RETURN QUERY
  SELECT 
    au.id,
    au.email::TEXT
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;

-- Grant execute permission to authenticated users (admin check is done inside function)
GRANT EXECUTE ON FUNCTION public.get_user_emails(UUID[]) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_user_emails(UUID[]) IS 'Returns user emails for admin users. Requires admin role.';

