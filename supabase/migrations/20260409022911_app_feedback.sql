-- Product feedback (not event surveys): short messages from authenticated users; admins review.

CREATE TABLE IF NOT EXISTS public.app_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('bug', 'idea', 'general', 'other')),
  message TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 8000),
  page_path TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_feedback_created_at ON public.app_feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_feedback_status ON public.app_feedback (status);
CREATE INDEX IF NOT EXISTS idx_app_feedback_user_id ON public.app_feedback (user_id);

ALTER TABLE public.app_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated insert own app_feedback" ON public.app_feedback;
CREATE POLICY "Authenticated insert own app_feedback" ON public.app_feedback
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins select app_feedback" ON public.app_feedback;
CREATE POLICY "Admins select app_feedback" ON public.app_feedback
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins update app_feedback" ON public.app_feedback;
CREATE POLICY "Admins update app_feedback" ON public.app_feedback
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins delete app_feedback" ON public.app_feedback;
CREATE POLICY "Admins delete app_feedback" ON public.app_feedback
  FOR DELETE TO authenticated
  USING (public.is_admin());
