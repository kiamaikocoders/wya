-- Contact form submissions land in app_feedback (admin inbox) as category = contact.
-- Guests may submit (nullable user_id); authenticated users are linked when signed in.

ALTER TABLE public.app_feedback
  DROP CONSTRAINT IF EXISTS app_feedback_category_check;

ALTER TABLE public.app_feedback
  ADD CONSTRAINT app_feedback_category_check
  CHECK (category IN ('bug', 'idea', 'general', 'other', 'contact'));

ALTER TABLE public.app_feedback
  ALTER COLUMN user_id DROP NOT NULL;

-- Keep authenticated self-insert for product feedback categories.
DROP POLICY IF EXISTS "Authenticated insert own app_feedback" ON public.app_feedback;
CREATE POLICY "Authenticated insert own app_feedback" ON public.app_feedback
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND category IN ('bug', 'idea', 'general', 'other', 'contact')
  );

-- Guests can insert contact-only rows (no user_id).
DROP POLICY IF EXISTS "Anon insert contact app_feedback" ON public.app_feedback;
CREATE POLICY "Anon insert contact app_feedback" ON public.app_feedback
  FOR INSERT TO anon
  WITH CHECK (
    category = 'contact'
    AND user_id IS NULL
  );
