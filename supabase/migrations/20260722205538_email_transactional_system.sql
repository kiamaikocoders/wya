-- Transactional email system: prefs, send log, reminder dedupe, newsletter/waitlist

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_email_prefs JSONB NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.profiles.notification_email_prefs IS
  'Per-type email opt-in/out. Keys match notification.type. Social types (follow, story_like) default off unless true.';

CREATE TABLE IF NOT EXISTS public.email_send_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  template_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  provider_id TEXT,
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_send_log_user_id_idx ON public.email_send_log (user_id);
CREATE INDEX IF NOT EXISTS email_send_log_created_at_idx ON public.email_send_log (created_at DESC);

ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_send_log_admin_select ON public.email_send_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.username = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS public.email_reminder_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id BIGINT NOT NULL,
  window_label TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id, window_label)
);

CREATE INDEX IF NOT EXISTS email_reminder_log_event_idx ON public.email_reminder_log (event_id);

ALTER TABLE public.email_reminder_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_reminder_log_admin_select ON public.email_reminder_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.username = 'admin'
    )
  );

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'footer',
  confirmed BOOLEAN NOT NULL DEFAULT true,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email)
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY newsletter_subscribers_insert_anon ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY newsletter_subscribers_select_own ON public.newsletter_subscribers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.username = 'admin'
  ));

-- Service role bypasses RLS for Edge Functions.
GRANT SELECT, INSERT, UPDATE ON public.email_send_log TO service_role;
GRANT SELECT, INSERT ON public.email_reminder_log TO service_role;
GRANT ALL ON public.newsletter_subscribers TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
