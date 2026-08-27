-- Friend requests: the followee can accept or decline; new rows must start pending.
-- SELECT UPDATE needs a matching SELECT policy (already present) plus this UPDATE policy.

DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
CREATE POLICY "Users can follow others"
  ON public.follows
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id AND status = 'pending');

DROP POLICY IF EXISTS "Users can view follows" ON public.follows;
CREATE POLICY "Users can view follows"
  ON public.follows
  FOR SELECT
  USING (
    status = 'accepted'
    OR auth.uid() = follower_id
    OR auth.uid() = following_id
  );

DROP POLICY IF EXISTS "Users can accept follow requests" ON public.follows;
CREATE POLICY "Users can accept follow requests"
  ON public.follows
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = following_id AND status = 'pending')
  WITH CHECK (auth.uid() = following_id AND status = 'accepted');

DROP POLICY IF EXISTS "Users can decline or remove follows" ON public.follows;
CREATE POLICY "Users can decline or remove follows"
  ON public.follows
  FOR DELETE
  TO authenticated
  USING (auth.uid() = following_id);

GRANT UPDATE ON public.follows TO authenticated;
