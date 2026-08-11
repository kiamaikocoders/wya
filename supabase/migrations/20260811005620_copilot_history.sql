-- WYA Co-pilot: server-side query / chat history (synced per user)

CREATE TABLE IF NOT EXISTS public.copilot_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New chat',
  city text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.copilot_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.copilot_sessions (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  event_ids integer[] NOT NULL DEFAULT '{}'::integer[],
  vibe_label text,
  budget_estimate jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS copilot_sessions_user_updated_idx
  ON public.copilot_sessions (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS copilot_messages_session_created_idx
  ON public.copilot_messages (session_id, created_at ASC);

CREATE INDEX IF NOT EXISTS copilot_messages_user_created_idx
  ON public.copilot_messages (user_id, created_at DESC);

COMMENT ON TABLE public.copilot_sessions IS 'WYA Co-pilot conversation threads per user';
COMMENT ON TABLE public.copilot_messages IS 'Individual user/assistant turns within a Co-pilot session';

ALTER TABLE public.copilot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;

-- Sessions: owner CRUD
CREATE POLICY "Users select own copilot sessions"
  ON public.copilot_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own copilot sessions"
  ON public.copilot_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own copilot sessions"
  ON public.copilot_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own copilot sessions"
  ON public.copilot_sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins select all copilot sessions"
  ON public.copilot_sessions FOR SELECT
  USING (is_admin());

-- Messages: owner CRUD (user_id denormalised for simple RLS)
CREATE POLICY "Users select own copilot messages"
  ON public.copilot_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own copilot messages"
  ON public.copilot_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.copilot_sessions s
      WHERE s.id = session_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users delete own copilot messages"
  ON public.copilot_messages FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins select all copilot messages"
  ON public.copilot_messages FOR SELECT
  USING (is_admin());

-- Keep updated_at fresh when a message is added
CREATE OR REPLACE FUNCTION public.touch_copilot_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.copilot_sessions
  SET updated_at = now()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS copilot_messages_touch_session ON public.copilot_messages;
CREATE TRIGGER copilot_messages_touch_session
  AFTER INSERT ON public.copilot_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_copilot_session();
